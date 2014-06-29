/*global $, MyDash */
/* exported ScorecardDashboard */
"use strict";

function ScorecardDashboardHelper() {
  this.round = {};

  this.chart = {};

  this.chart.getTooltip = function() {
    var tooltip = {};
    //debugger;
    tooltip.headerFormat = "<b>{series.name}</b><br>";
    tooltip.pointFormat = "{point.x:%e. %b}: {point.y} pts<br /><a href='#''>Round {point.myRound.nr}</a>";
    return tooltip;
  };

}

var MyHelper = new ScorecardDashboardHelper();

// Class definition
function ScorecardDashboard() {
  this.testvar = "max";


  this.initData = function() {
    this.data = {};
    this.initPlayers();
  };

  this.initPlayers = function() {
    this.data.players = {};
    this.addPlayer("Max");
  };

  this.addPlayer = function(name) {
    // only works for 'Max' right now, because data is hard coded
    name = "Max";
    var playerMax = {};
    this.data.players[name] = playerMax;
    
    playerMax.name = name;
    playerMax.handicapHistory = [];
    playerMax.handicapHistory.push( {
      fromDate: new Date(2012, 10, 31),
      handicap: 45
    } );
    playerMax.handicapHistory.push( {
      fromDate: new Date(2013, 8, 7),
      handicap: 43
    } );
  };

  this.getPlayerHandicap = function(player, date) {
    // loop over handicap history
    for (var i = player.handicapHistory.length - 1; i >= 0; i--) {
      if (date > player.handicapHistory[i].fromDate) {
        return player.handicapHistory[i].handicap;
      }
    }
    return 45;
  };



  this.getRound = function(roundNr) {
    for (var i = 0; i < this.data.rounds.length; i++) {
      if(this.data.rounds[i].nr == roundNr) {
        return this.data.rounds[i];
      }
    }
  };


  this.calculateHole = function(hole) {
    var round = this.getRound(hole.roundNr);
    hole.stablefordHandicap = this.calculateStablefordHandicap(round.handicap, round.course.holes[hole.nr].handicapRank);
    hole.stablefordNettoPts = this.calculateStablefordPts(round.course.holes[hole.nr].par, hole.strokes, hole.stablefordHandicap);
    hole.stablefordBruttoPts = this.calculateStablefordBruttoPts(round.course.holes[hole.nr].par, hole.strokes);
    hole.proResult = hole.strokes - round.course.holes[hole.nr].par;
    hole.greenInStrokes = hole.strokes - hole.putts;
    return hole;
  };

  this.calculateStablefordBruttoPts = function(par, strokes) {
    return this.calculateStablefordPts(par, strokes, 0);
  };

  this.calculateStablefordPts = function(par, strokes, handicap) {
    if(strokes === 0) {
      return 0;
    }
    var pts = 0;
    pts = handicap + par + 2 - strokes;
    if(pts < 0) pts = 0;
    return pts;
  };

  this.calculateStablefordHandicap = function(roundHandicap, holeHandicapRank) {
    var handicap = 0;
    handicap += Math.floor( Math.abs(roundHandicap) / 18 );
    if( (Math.abs(roundHandicap) % 18) - holeHandicapRank >= 0) {
      handicap++;
    }
    return handicap;
  };


  this.calculateRound = function(round) {
    // get all the basic round information right
    round.handicap = round.course.getHandicap(round.player, round.start);
    round.duration = this.getDuration(round.start, round.end);
    round.durationHours = Math.floor(round.duration / 36e5);
    round.durationMinutes = Math.floor(round.duration % 36e5 / 60000);
    round.durationString = round.durationHours + ":" + round.durationMinutes;

    // initialize the sums
    round.strokes = 0;
    round.stablefordNettoPts = 0;
    round.stablefordBruttoPts = 0;
    round.proResult = 0;
    round.putts = 0;
    round.penalties = 0;
    round.girlies = 0;
    round.lostBalls = 0;
    round.finishedHoles = 0;
    // calculate all the individual holes
    var thisCont = this;
    $.each( round.holes, function( holeNr, hole ) {
      round.holes[holeNr] = thisCont.calculateHole(hole);
      // calculate all the SUMS
      round.strokes += hole.strokes;
      round.stablefordNettoPts += hole.stablefordNettoPts;
      round.stablefordBruttoPts += hole.stablefordBruttoPts;
      round.proResult += hole.proResult;
      round.putts += hole.putts;
      round.penalties += hole.penalties;
      round.girlies += hole.girlies;
      round.lostBalls += hole.lostBalls;
      if(hole.strokes > 0) {
        round.finishedHoles++;
      }
    });

    // end of round calculations
    if(round.holes.length == round.finishedHoles) {
      round.completed = true;
    } else {
      round.completed = false;
    }
    round.puttAverage = round.putts / round.finishedHoles;


    return round;
  };

  this.getDuration = function(start, end) {
    var diff = new Date();
    diff = end - start;
    return diff;
  };

  this.calculateAllData = function() {
    for (var r = 0; r < this.data.rounds.length; r++) {
      this.data.rounds[r] = this.calculateRound(this.data.rounds[r]);
    }
  };

  this.createDataFromTsv = function(importData) {
    var lines = importData.split(/\n/);

    // Definition of Import Configuration Parameters
    // ZERO-BASED INDICES
    var conf = {};
    conf.holeOffset = 1;
    conf.datalineHoleNrs       = 0;
    conf.datalinePar           = 1;
    conf.datalineDistanceMen   = 2;
    conf.datalineDistanceWomen = 3;
    conf.datalineHandicap      = 4;

    conf.datacolInfo           = 20;
    conf.datacolDate           = 21;
    conf.datacolStart          = 22;
    conf.datacolEnd            = 23;
    conf.datacolWeather        = 24;
    conf.datacolFlight         = 25;
    conf.datacolFlightPartners = 26;
    conf.datacolTournament     = 27;
    conf.datacolNotes          = 28;
    conf.datacolHandicap       = 29;
    conf.datacolHolesPlayed    = 30;

    // create basic information
    this.data.courses = {};
    // add the course for GCL
    var course = {
      name: "GC St. Lorenzen",
      courseid: 9,
      holes: {}
    };
    this.data.courses[9] = course;
    course.getHandicap = function(player, date) {
      // TODO Platzvorgaben eingeben
      // Berechnung anhand persönlicher Vorgabe und Platzvorgabe
      // bis dahin mal immer 45 retournieren
      if(player) {}
      if(date) {}
      return 45;
    };
    // add the holes to GCL course
    var hole = {};
    var arrHoleLine = lines[conf.datalineHoleNrs].split(/\t/);
    var arrParLine  = lines[conf.datalinePar].split(/\t/);
    var arrDistanceMenLine  = lines[conf.datalineDistanceMen].split(/\t/);
    var arrDistanceWomenLine  = lines[conf.datalineDistanceWomen].split(/\t/);
    var arrHandicapLine  = lines[conf.datalineHandicap].split(/\t/);
    var arrIndices = [];
    var holeNr = 1;
    for (var h = 0; h < arrHoleLine.length; h++) {
      if (arrHoleLine[h] == holeNr) {
        arrIndices[holeNr] = h;
        course.holes[holeNr] = {};
        course.holes[holeNr].nr = holeNr;
        course.holes[holeNr].par = arrParLine[h] * 1;
        course.holes[holeNr].distanceMen = arrDistanceMenLine[h] * 1;
        course.holes[holeNr].distanceWomen = arrDistanceWomenLine[h] * 1;
        course.holes[holeNr].handicapRank = arrHandicapLine[h] * 1;
        holeNr++;
      }
    }

    // Add the played rounds
    var roundNr = 0;
    var arrLine = [];
    var round = {};
    this.data.rounds = [];
    for (var l = 0; l < lines.length; l++) {
      // handle one line at a time
      arrLine = lines[l].split(/\t/);

      // new round starting with this line
      // add all information for the round
      if (arrLine[conf.datacolInfo] == "Schläge") {
        roundNr++;
        round = {};
        this.data.rounds.push(round);
        round.nr = roundNr;
        round.start = this.parseDate(arrLine[conf.datacolDate],arrLine[conf.datacolStart]);
        round.end = this.parseDate(arrLine[conf.datacolDate],arrLine[conf.datacolEnd]);
        round.weather = arrLine[conf.datacolWeather];
        round.flight = arrLine[conf.datacolFlight];
        round.flightPartners = arrLine[conf.datacolFlightPartners];
        round.notes = arrLine[conf.datacolNotes];
        round.tournament = arrLine[conf.datacolTournament];
        // round.handicap = arrLine[conf.datacolHandicap];
        round.holesPlayed = arrLine[conf.datacolHolesPlayed];
        // only rounds in GCL so far
        round.course = this.data.courses[9];
        // only rounds by Max so far
        round.player = this.data.players.Max;

        // get the next/relevant lines
        var arrNextLine = [];
        var arrLinePutts = [];
        var arrLinePenalties = [];
        var arrLineGirlies = [];
        var arrLineLostBalls = [];
        var nextLineIndex = l;
        do {
          nextLineIndex++;
          arrNextLine = lines[nextLineIndex].split(/\t/);
          switch (arrNextLine[conf.datacolInfo]) {
            case "Putts":
              arrLinePutts = arrNextLine;
              break;
            case "Penalties":
              arrLinePenalties = arrNextLine;
              break;
            case "Girlies":
              arrLineGirlies = arrNextLine;
              break;
            case "Lost Balls":
              arrLineLostBalls = arrNextLine;
              break;
          }
        } while (arrNextLine[conf.datacolInfo] !== "");

        // add the holes with their information
        round.holes = {};
        for (var j = 1; j < arrIndices.length; j++) {
          if (arrLine[arrIndices[j]] === "") { continue; }
          hole = {};
          round.holes[j] = hole;
          hole.roundNr   = round.nr; // BACKREFERENCE if round is used directly!
          hole.nr        = j;
          hole.strokes   = this.intOrZero(arrLine[arrIndices[j]]);
          hole.putts     = this.intOrZero(arrLinePutts[arrIndices[j]]);
          hole.penalties = this.intOrZero(arrLinePenalties[arrIndices[j]]);
          hole.girlies   = this.intOrZero(arrLineGirlies[arrIndices[j]]);
          hole.lostBalls = this.intOrZero(arrLineLostBalls[arrIndices[j]]);
          // arrIndices[j]
        }
      }
      // exit if TEMPLATE line is reached
      if (arrLine[conf.datacolInfo] == "TEMPLATE") {
        break;
      }
    }
  };

  this.intOrZero = function(intValue) {
    if(isNaN(intValue)) {
      return 0;
    } else {
      return intValue * 1;
    }
  };

  // parse a date in yyyy-mm-dd format
  // parse a time in hh:mm format
  this.parseDate = function(inputDate, inputTime) {
    if (inputTime === null) { inputTime = "06:00";}
    var partsDate = inputDate.split("-");
    var partsTime = inputTime.split(":");
    // new Date(year, month [, day [, hours[, minutes[, seconds[, ms]]]]])
    return new Date(partsDate[0], partsDate[1]-1, partsDate[2], partsTime[0], partsTime[1]); // Note: months are 0-based
  };


  this.getRoundTitle = function(round) {
    var title = "";
    var s = round.start;
    var e = round.end;
    var date = s.getDate() + "." + s.getMonth() + "." + s.getFullYear();
    var time = this.twoZeros(s.getHours()) + ":" + this.twoZeros(s.getMinutes()) + "-" + this.twoZeros(e.getHours()) + ":" + this.twoZeros(e.getMinutes());
    var nettopts =  "NettoPts: "+ round.stablefordNettoPts;
    var puttavg = "PuttAvg: " + round.puttAverage.toPrecision(2);
    title = date + ", " + time + " - " + nettopts + " - " + puttavg;
    return title;
  };

  this.twoZeros = function(int) {
    var s = "";
    s = "0" + int;
    s = s.slice(-2);
    return s;
  };


  this.loadChartSingleRound = function(roundNr) {
    var round = MyDash.getRound(roundNr);
    var chartXAxis = this.getChartXAxis(round);
    var chartSeries = this.getChartSeriesSingleRound(round);
      $("#chartSingleRound").highcharts({
        chart: {
          type: "column"
        },
        title: {
          text: this.getRoundTitle(round)
        },
        xAxis: chartXAxis,
        yAxis: {
          min: 0,
          title: {
            text: "Stableford Netto (Pts)"
          }
        },
        series: chartSeries
      });
  };
    
  this.getChartXAxis = function(round) {
    var axis = {};
    axis.categories = [];
    $.each( round.holes, function( holeNr, hole ) {
      axis.categories.push(hole.nr);
    });
    return axis;
  };

  this.getChartSeriesSingleRound = function(round) {
    var series = [];
    series.push({
      name: "Stableford Netto (Pts)",
      data: this.getDataStablefordNettoPtsForRound(round)
    });
    return series;
  };

  this.getDataStablefordNettoPtsForRound = function(round) {
    var data = [];
    $.each( round.holes, function( holeNr, hole ) {
      data.push(hole.stablefordNettoPts);
    });
    return data;
  };

  this.getSeriesChartAllRounds = function() {
    var series = [];
    series.push({
      name: "Full 18 holes",
      data: this.getDataStablefordNettoPtsForAllRounds(this.data.rounds, "full"),
      color: "#33f"
    });
    series.push({
      name: "Short (9) rounds",
      data: this.getDataStablefordNettoPtsForAllRounds(this.data.rounds, "short"),
      color: "#99f"
    });
    return series;
  };

  this.getDataStablefordNettoPtsForAllRounds = function(rounds, filter) {
    var data = [];
    var pts = 0;
    var includeData = false;
    for (var i = 0; i < rounds.length; i++) {
      var s = rounds[i].start;
      var d = Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate());
      // calculate the 18-hole equivalent for 9-hole or other shorter rounds
      pts = rounds[i].stablefordNettoPts / rounds[i].holesPlayed * 18;
      includeData = false;
      if(filter === undefined || filter === "") {
        includeData = true;
      } else if(filter == "full" && rounds[i].holesPlayed == 18) {
        includeData = true;
      } else if(filter == "short" && rounds[i].holesPlayed < 18) {
        includeData = true;
      }
      if(includeData) {
        var dataObject = {};
        dataObject.x = d;
        dataObject.y = pts;
        dataObject.myRound = rounds[i];
        dataObject.color = this.getColorForPointRound(rounds[i]);
        if(rounds[i].tournament !== "") {
          dataObject.marker = {};
          dataObject.marker.symbol = "diamond";
          dataObject.color = "#f00";
        }
        data.push(dataObject);
        // data.push([d, pts]);
      }
    }
    return data;
  };

  this.getColorForPointRound = function(round) {
    var color = "";
    if(round.holesPlayed == 18) {
      color = "#33f";
    } else {
      color = "#99f";
    }
    return color;
  };


  this.showStatsAllRounds = function(min, max) {
    var html = "";
    html += "<h3>Statistics</h3>";
    var minDate = new Date(min);
    var maxDate = new Date(max);
    var stats = this.calculcateStatsAllRounds(min, max);
    html += minDate.getDate() + "." + minDate.getMonth() + "." + minDate.getFullYear();
    html += " - " + maxDate.getDate() + "." + maxDate.getMonth() + "." + maxDate.getFullYear();
    html += "<br/>";
    html += "Rounds: " + stats.stablefordNettoPts.count;
    html += "<br/>";
    html += "Average: " + stats.stablefordNettoPts.avg;
    html += "<br/>";
    html += "Min: " + stats.stablefordNettoPts.min;
    html += "<br/>";
    html += "Max: " + stats.stablefordNettoPts.max;
    html += "<br/>";
    // html += "<table>";
    // html += "<tr><td>"
    // html += "</table>";
    $("#statsAllRounds").html(html);
  };

  this.calculcateStatsAllRounds = function(min, max) {
    var stats = {};
    stats.stablefordNettoPts = {};
    stats.stablefordNettoPts.sum = 0;
    stats.stablefordNettoPts.min = 99;
    stats.stablefordNettoPts.max = 0;
    stats.stablefordNettoPts.avg = 0;
    stats.stablefordNettoPts.count = 0;
    var rounds = this.data.rounds;
    if(min === undefined) min = rounds[0].start;
    if(max === undefined) max = rounds[rounds.length-1].start;
    var pts = 0;
    for (var i = 0; i < rounds.length; i++) {
      if(rounds[i].start > min && rounds[i].start < max) {
        // JA, aktuelle Runde berücksichtigen
        // calculate the 18-hole equivalent for 9-hole or other shorter rounds
        pts = rounds[i].stablefordNettoPts / rounds[i].holesPlayed * 18;
        stats.stablefordNettoPts.sum += pts;
        stats.stablefordNettoPts.min = Math.min(stats.stablefordNettoPts.min, pts);
        stats.stablefordNettoPts.max = Math.max(stats.stablefordNettoPts.max, pts);
        stats.stablefordNettoPts.count++;
      }
    };
    stats.stablefordNettoPts.avg = (stats.stablefordNettoPts.sum / stats.stablefordNettoPts.count).toFixed(2);
    return stats;
  };


  this.showChartAllRounds = function(elementString) {
    $(elementString).highcharts({
      chart: {
        type: "scatter",
        zoomType: "x",

        events: {
          redraw: function(event) {
            MyDash.showStatsAllRounds(event.currentTarget.xAxis[0].min,event.currentTarget.xAxis[0].max);
          },
          load: function(event) {
            MyDash.showStatsAllRounds(event.currentTarget.xAxis[0].min,event.currentTarget.xAxis[0].max);
          }
        }
      },
      title: {
        text: "Stableford Netto Result of all played rounds"
      },
      xAxis: {
        type: "datetime",
        dateTimeLabelFormats: { // don't display the dummy year
          week: "%e. %b"
        },
        title: {
            text: "Datum"
        },
        events: {
          setExtremes: function(event) {
            if(event) {}
            //debugger;
          }
        }
      },
      yAxis: {
        title: {
           text: "Stableford Netto (pts)"
        },
        min: 0,
        plotLines: [{
          color: "#0000AA",
          width: 1,
          value: 36
        }]
      },
      tooltip: MyHelper.chart.getTooltip(),

      series: MyDash.getSeriesChartAllRounds(),

      plotOptions: {
        series: {
          cursor: "pointer",
          point: {
            events: {
              click: function() {
                MyDash.loadChartSingleRound(event.point.myRound.nr);
              }
            }
          },
          marker: {
            lineWidth: 1
          }
        }
      }
      
    });
  }; // showChartAllRounds

}