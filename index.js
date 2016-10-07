#!/usr/bin/env node --harmony
var fs = require('fs');
var ProgressBar = require('progress');
var chalk = require('chalk');
var program = require('commander');
var co = require('co');
var prompt = require('co-prompt');
var request = require('superagent');
var ChartMogul = require('chartmogul-node');
var jsonfile = require('jsonfile');
var path = require('path');
var assert = require('assert');
var RSVP = require('rsvp');
var Spinner = require('cli-spinner').Spinner;
var moment = require('moment');
var babar = require('babar');
var metrics = ['mrr', 'all', 'arr', 'customer-churn-rate', 'mrr-churn-rate', 'ltv', 'customers', 'asp', 'arpa'];

program
	.usage('<metric> [options]')
	.arguments('<metric>')
	.option('<metric>', 'The metric you would like fetch, e.g. all, mrr, arr, customer-churn-rate, mrr-churn-rate, ltv, customers, asp, arpa')
	.option('-t, --this <increment>', 'A handy replacement for the start and end date fields, e.g. week, month, quarter')
	.option('-s, --start-date <start>', 'The start date of the required period of data. An ISO-8601 formatted date, e.g. 2015-05-12')
	.option('-e, --end-date <end>', 'The end date of the required period of data. An ISO-8601 formatted date, e.g. 2015-05-12')
	.option('-i, --interval <interval>', 'One of `day`, `week`, `month` (default), or `quarter`')
	.option('-g, --geo <geo>', 'A comma-separated list of ISO 3166-1 Alpha-2 formatted country codes to filter the results to, e.g. US,GB,DE (optional)')
	.option('-P, --plans <plans>', 'A comma-separated list of plan names (as configured in your ChartMogul account) to filter the results to, e.g. Silver%20plan,Gold%20plan,Enterprise%20plan (optional)')
	.option('-c, --chart', 'View the result in a chart')
	.on('--help', function(){
	  console.log('  Examples:');
	  console.log('');
	  console.log('    $ chartmogul all --start-date 2016-01-01 --end-date 2016-10-15');
	  console.log('    $ chartmogul mrr --start-date 2016-01-01 --end-date 2016-10-15 -geo DE,US');
	  console.log('    $ chartmogul ltv --this week -plans Silver,Gold');
	  console.log('');
	})
	.action(function(metric) {
		
		if (metrics.indexOf(metric.toString()) < 0 ){
			console.log(chalk.red("Error: " + metric + " is not a supported metric. Try one of the following: all, mrr, arr, customer-churn-rate, mrr-churn-rate, ltv, customers, asp, arpa"));
			return;
		}

		var username, password, auth, error;
		var attempts = 0;

		var spinner = new Spinner('%s');
		spinner.setSpinnerString('⣾⣽⣻⢿⡿⣟⣯⣷');

		function getAuthorisation(callback) {
			jsonfile.readFile(path.join(__dirname, './auth.json'), function(err, obj) {
				error = err;
				auth = obj;
				callback(err, obj);
			});
		}

		function showSpinner(){
			spinner.start();
		}

		function hideSpinner(){
			if (spinner.isSpinning()){
				spinner.stop(true);
			}
		}

		function requestAuthorisation(){
			return new RSVP.Promise(function(resolve, reject) {
				co(function *() {
					var auth = {
						username: program.username || (yield prompt('API Token: ')),
						password: program.password || (yield prompt.password('Secret Key: '))
					};
					jsonfile.writeFileSync(path.join(__dirname, './auth.json'), {token: auth.username, key: auth.password});
					resolve(auth);
				});
			});
		}

		function errorOut(err){
			hideSpinner();
			console.log(chalk.red(err + " Type chartmogul -h for more info."));
			process.exit(1);
		}

		function testChartMogulKeys(u, p, callback){
			
			showSpinner();

			request
			.get('https://api.chartmogul.com/v1/ping')
			.auth(u, p)
			.set('Accept', 'application/json')
			.end(function (err, res) {
				if (res && res.ok) {
					username = u;
					password = p;
			    	callback(res.body)
				}
				
				var errorMessage;
				
				if (res && res.status === 401) {
					hideSpinner();

					console.error(chalk.red("Authentication failed! Bad API token or key?"));
					
					if (attempts > 3){ errorOut("Authentication error. Quitting ChartMogul CLI."); }
					else { attempts++; }

					requestAuthorisation()
					.then(auth =>{
						testChartMogulKeys(auth.username, auth.password, callback);
					})
					.catch(errorOut);

				} else if (err) {
					hideSpinner();
					errorMessage = err; 
					console.error(chalk.red(errorMessage));
				}

				if (!res) { process.exit(1) }
			});
		}


		function requestMetrics(auth_response){
			
			// console.log(chalk.bold.cyan('Authentication Response: ') + auth_response.data);

			var datePath, start, end;

			if ((program.startDate && program.endDate) || program.this){
				if (program.this){
					end = moment();
					start = moment().subtract(1, program.this+"s");
					datePath = '?start-date='+start.toISOString().split('T')[0]+'&end-date='+end.toISOString().split('T')[0];
				}
				else {
					if (program.startDate.length > 9 && program.endDate.length > 9){
						start = moment(program.startDate);
						end = moment(program.endDate);
						if (start.isValid() && end.isValid()){
							datePath = '?start-date='+start.toISOString().split('T')[0]+'&end-date='+end.toISOString().split('T')[0];
						}
						else {
							errorOut("Error. Dates must be in the format YYYY-MM-DD, e.g. 2015-01-25.");
						}
					}
					else {
						errorOut("Error. Dates must be in the format YYYY-MM-DD, e.g. 2015-01-25.");
					}
				}
			}
			else {
				errorOut("Error: Missing parameters --start-date and --end-date or just --this are required.");
			}

			var path = metric+datePath + (program.geo ? "&geo="+program.geo : "") + (program.plans ? "&plans="+program.plans : "") + (program.interval ? "&interval="+program.interval : "&interval=month");
			
			request
			.get('https://api.chartmogul.com/v1/metrics/'+path)
			.auth(username, password)
			.set('Accept', 'application/json')
			.end(function (err, res){
				hideSpinner();

				var title = 'ChartMogul '+metric.toUpperCase()+' from '+start.toISOString().split('T')[0]+' to ' + end.toISOString().split('T')[0];
				if (!err && res.ok) {					
					if (program.chart) { printChart(metric, res.body.entries, title); }
					else {
						console.log(chalk.bold.cyan(title));
						console.log(res.body.entries)
					}
				}
				var errorMessage;
				if (res && res.status === 401) {
					errorMessage = "Authentication failed! Bad username/password?";
				} else if (err) {
					errorMessage = err;
				} else {
					errorMessage = res.text;
				}
				
				if (err){ errorOut(errorMessage); }
			});
		}

		function printChart(metric, entries, title){
			var a = [];
			var i = 0;
			
			entries.forEach(function(entry){
				i++
				a.push([i,entry[metric]])
			})
			
			console.log(chalk.bold.cyan(title));
			if (metric === "all"){ console.log(chalk.red("Note: Charts not possible when fetching `all` metrics"))}
			
			console.log(babar(a, {
			  color: 'red',
			  width: 90,
			  height: 15,
			  yFractions: 1
			}));

			process.exit(0);
		}

		getAuthorisation(function(err, obj){

			if (err || !obj.token || !obj.key){
				console.log(chalk.bold.red( "Authentication required!" ));

				requestAuthorisation()
				.then(auth =>{
					testChartMogulKeys(auth.username, auth.password, requestMetrics);
				})
				.catch(errorOut);

			}
			else {
				username = auth.token;
				password = auth.key;

				testChartMogulKeys(username, password, requestMetrics);
			}
		});
	})
	.parse(process.argv);

if (!process.argv.slice(2).length || metrics.indexOf(process.argv[2]) < 0) {
	console.log("");
	console.log(chalk.red("  Error: Please specify metric you would like fetch, e.g. all, mrr, arr, customer-churn-rate, mrr-churn-rate, ltv, customers, asp, arpa."))
	program.outputHelp();
}