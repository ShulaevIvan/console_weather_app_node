#!/usr/bin/env node
'use-strict'

require('dotenv').config();
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const WeatherForecast = require('./src/WeatherForecast');

yargs(hideBin(process.argv))
.command({
    command: 'get',
    describe: 'starting app',
    handler: (argv) => {
        const params = argv._;
        if (params.length > 1) {
            const city = params.splice(1, 1)[0];
            WeatherForecast.getWeatherByCity(city);
            return;
        }
        WeatherForecast.rl.question('select city : ', (ans) => {
            WeatherForecast.getWeatherByCity(ans);
        });
    }
}).parse();

