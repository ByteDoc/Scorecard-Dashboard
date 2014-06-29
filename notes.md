# Notes for Scorecard Development

## MyDash.data (ScorecardDashboard)

- courses {}
    + "9" (id)
        * courseid
        * getHandicap(player,date)
        * holes
            - 1-18 (index)
                + distanceMen
                + distanceWomen
                + handicapRank
                + nr
                + par
        * name
}
- players {}
    + "Max" (name)
        * handicapHistory[]
            - fromDate
            - handicap
        * name
}
- rounds[]
    + ...
    + holes {}
        * 1-18 (nr)
            - ...
            - round
            - ...
    + ...