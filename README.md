ChartMogul CLI
---------------

Request [ChartMogul](https://chartmogul.com) Metrics from the command line.

Much inspired by Tim Petterson's blog post [Building command line tools with Node.js](https://developer.atlassian.com/blog/2015/11/scripting-with-node/).

## Installation

You will need your ChartMogul API Token and Secret Key (found at https://app.chartmogul.com/#admin/api).

```sh
$ npm install -g chartmogul-cli
```

## Usage

Get help

```sh
$ chartmogul -h
```

```
  Usage: chartmogul <metric> [options]

  Options:

    -h, --help                 output usage information
    <metric>                   The metric you would like fetch, e.g. all, mrr, arr, customer-churn-rate, mrr-churn-rate, ltv, customers, asp, arpa
    -t, --this <increment>     A handy replacement for the start and end date fields, e.g. week, month, quarter
    -s, --start-date <start>   The start date of the required period of data. An ISO formatted date, e.g. 2015-05-12
    -e, --end-date <end>       The end date of the required period of data. An ISO formatted date, e.g. 2015-05-12
    -i, --interval <interval>  One of `day`, `week`, `month` (default), or `quarter`
    -g, --geo <geo>            A comma-separated list of ISO 3166-1 Alpha-2 formatted country codes e.g. US,GB,DE
    -P, --plans <plans>        A comma-separated list of plan names e.g. Silver%20plan,Gold,Enterprise
    -c, --chart                View the result in a chart

  Examples:

    $ chartmogul all --start-date 2016-01-01 --end-date 2016-10-15
    $ chartmogul mrr --start-date 2016-01-01 --end-date 2016-10-15 -geo DE,US
    $ chartmogul ltv --this week -plans Silver,Gold
```

Get metrics for this week / day / month / etc.

```
$ chartmogul mrr --this week
```

![Screenshot](http://imgur.com/4v6VI8y.png)

Get all metrics for specific period.

```
$ chartmogul all --start-date 2016-01-01 --end-date 2016-10-15
```

Get a metric for a group of plans

```
$ chartmogul all --start-date 2016-01-01 --end-date 2016-10-15 --plans Gold,Silver
```

Get a metric for a region or set of regions

```
$ chartmogul all --this month --geo US,GB,DE
```

Get a chart of your metrics

```
chartmogul mrr --this year
```

![Screenshot](http://i.imgur.com/xmso0uo.png)