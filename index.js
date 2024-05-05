#!/usr/bin/env node
'use-strict'

require('dotenv').config();
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const http = require('http');
const readline = require('readline');
const { stdin: input, stdout: output } = require('node:process');
const rl = readline.createInterface({ input, output });
const baseUrl = process.env.API_URL;
console.log(baseUrl)

const formatTime = (timeString) => {
    const year = new Date(timeString).getFullYear();
    const month = `${new Date(timeString).getDay() < 10 ? `0${new Date(timeString).getDate()}` : new Date(timeString).getDay()}`;
    const day = `${new Date(timeString).getMonth() < 10 ? `0${new Date(timeString).getMonth()}` : new Date(timeString).getMonth()}`;
    const time = timeString.match(/\d{2}:\d{2}/)[0];

    return `${time} ${day}.${month}.${year}`;
};

const weatherPrintTamplate = (jsonData) => {
    const country = jsonData.location.country;
    const cityName = jsonData.location.name;
    const region = jsonData.location.region;
    const timeZone = `+${jsonData.location.utc_offset.replace(/.\d{1}/, '')}`
    const time = formatTime(jsonData.location.localtime);
    const weather = {
        temp: jsonData.current.temperature >= 0 ? `+${jsonData.current.temperature}°C` : `-${jsonData.current.temperature}°C`,
        humidity: `${jsonData.current.humidity}%`,
        feelslike: jsonData.current.feelslike >= 0 ? `+${jsonData.current.feelslike}°C` : `-${jsonData.current.feelslike}°C`,
        description: jsonData.current.weather_descriptions.join(),
        windSpeed: `${jsonData.current.wind_speed}m/s`,
        windDeg: `${jsonData.current.wind_degree}°`,
        windDir: jsonData.current.wind_dir,
        pressure: `${jsonData.current.pressure}mm Hg`,
        visibility: `${jsonData.current.visibility}m`,
        isDay: jsonData.current.id_day === 'yes' ? `day` : 'night',
        uv_index: `ultraviolet index: ${jsonData.current.uv_index}`,
    }
    const printTemplate = `
            --- Region info ---
    Region: --- ${country} | ${cityName} ---
    Time : --- ${time} | TimeZone ${timeZone} ---
    ${weather.isDay}
    ----------------------------
            --- Weather ---
    ${weather.description}
    tempirature: ${weather.temp}
    temp feelslike: ${weather.feelslike}
    ----------------------------
    humidity: ${weather.humidity}
    win direction: ${weather.windDir}
    wind degree: ${weather.windDeg}
    wind speed: ${weather.windSpeed}
    ----------------------------
    pressure: ${weather.pressure}
    visibility: ${weather.visibility}
    ${weather.uv_index}
    `;
    console.log(printTemplate)
};

const startProgram = (err=false) => {
    if (err) {
        console.log(err)
        console.log(`input err!`);
        rl.question('select city : ', (ans) => getWeatherByCity(ans));
    }
    rl.question('repeat - 1, exit - 2: ', (ans) => {
        const num = Number(ans.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, ''));
        if (num === 2) return rl.close();
        rl.question('select city : ', (ans) => getWeatherByCity(ans));
    });

};

const getWeatherByCity = async (cityName) => {
    return new Promise((resolve, reject) => {
        http.get(`${baseUrl}/current?access_key=${process.env.API_KEY}&query=${cityName}`, (response) => {
            const { statusCode } = response;
            const contentType = response.headers['content-type'];
            let rawData = '';
            console.log(statusCode)
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
        startProgram();
    })
    .catch((err) => {
        startProgram(err);
    })
};

yargs(hideBin(process.argv))
.command({
    command: 'get',
    describe: 'starting app',
    handler: (argv) => {
        const params = argv._;
        if (params.length > 1) {
            const city = params.splice(1, 1)[0];
            getWeatherByCity(city);
            return;
        }
        rl.question('select city : ', (ans) => {
            getWeatherByCity(ans);
        });
    }
}).parse();

