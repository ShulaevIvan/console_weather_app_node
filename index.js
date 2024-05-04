#!/usr/bin/env node
'use-strict'

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const http = require('http');
const readline = require('readline');
const { stdin: input, stdout: output } = require('node:process');
const rl = readline.createInterface({ input, output });
const apiKey = '';
const baseUrl = 'http://api.weatherstack.com';

const testData = {
    request: { type: 'City', query: 'Moscow, Russia', language: 'en', unit: 'm' },
    location: {
      name: 'Moscow',
      country: 'Russia',
      region: 'Moscow City',
      lat: '55.752',
      lon: '37.616',
      timezone_id: 'Europe/Moscow',
      localtime: '2024-05-04 18:53',
      localtime_epoch: 1714848780,
      utc_offset: '3.0'
    },
    current: {
      observation_time: '03:53 PM',
      temperature: 13,
      weather_code: 113,
      weather_icons: [
        'https://cdn.worldweatheronline.com/images/wsymbols01_png_64/wsymbol_0001_sunny.png'
      ],
      weather_descriptions: [ 'Sunny' ],
      wind_speed: 22,
      wind_degree: 290,
      wind_dir: 'WNW',
      pressure: 1010,
      precip: 0,
      humidity: 35,
      cloudcover: 0,
      feelslike: 11,
      uv_index: 3,
      visibility: 10,
      is_day: 'yes'
    }
}

const formatTime = (timeString) => {
    const time = timeString.match(/\d{2}:\d{2}/)[0];
    const year = new Date(timeString).getFullYear();
    const month = `${new Date(timeString).getDay() < 10 ? `0${new Date(timeString).getDay()}` : new Date(timeString).getDay()}`;
    const day = `${new Date(timeString).getMonth() < 10 ? `0${new Date(timeString).getMonth()}` : new Date(timeString).getMonth()}`;

    return `${time} ${day}.${month}.${year}`;
};

const weatherPrintTamplate = (jsonData) => {
    const country = jsonData.location.country;
    const cityName = jsonData.location.name;
    const region = jsonData.location.region;
    const timeZone = `+${jsonData.location.utc_offset.replace(/.\d{1}/, '')}`
    const printString = ` ${jsonData.location}`;
    const time = formatTime(jsonData.location.localtime);
    const weather = {
        temp: jsonData.current.temperature >= 0 ? `+${jsonData.current.temperature}°C` : `-${jsonData.current.temperature}°C`,
        humidity: `${jsonData.current. humidity}%`,
        feelslike: jsonData.current.feelslike >= 0 ? `+${jsonData.current.feelslike}°C` : `-${jsonData.current.feelslike}°C`,
        description: jsonData.current.weather_descriptions.join(),
        windSpeed: `${jsonData.current.wind_speed}m/s`,
        windDeg: `${jsonData.current.wind_degree}°`,
        windDir: jsonData.current.wind_dir,
        pressure: `${jsonData.current.pressure}mm Hg`,
        visibility: `${jsonData.current.visibility}m`,
        isDay: jsonData.current.isDay === 'yes' ? `day` : 'night',
        uv_index: `ultraviolet index: ${jsonData.current.uv_index}`,
    }
    console.log(weather)
};

const getWeatherByCity = async (cityName) => {
    return new Promise((resolve, reject) => {
        http.get(`${baseUrl}/current?access_key=${apiKey}&query=${cityName}`, (response) => {
            const { statusCode } = response;
            const contentType = response.headers['content-type'];
            let rawData = '';
    
            if (statusCode !== 200) {
                const err = new Error('Request Failed.\n' + `Status Code: ${statusCode}`)
                reject(err);
            }
            response.setEncoding('utf-8');
            response.on('data', (chunk) => { rawData += chunk; });
            response.on('end', () => {
                try {
                  const parsedData = JSON.parse(rawData);
                  resolve(parsedData);
                } 
                catch (e) {
                  reject(e.message);
                }
            });
        });
    })
    .then((data) => {
        weatherPrintTamplate(data);
    })
    .catch((err) => {
        console.log(err);
    })
};


yargs(hideBin(process.argv))
.command({
    command: 'get',
    describe: 'starting app',
    handler: (argv) => {
        weatherPrintTamplate(testData)
        // rl.question('select city : ', (ans) => {
           
        //     // getWeatherByCity(ans);
        // })
        // console.log(argv)
    }
}).parse();

