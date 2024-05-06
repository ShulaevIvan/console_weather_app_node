'use-strict'

require('dotenv').config();
const http = require('http');
const readline = require('readline');
const { stdin: input, stdout: output } = require('node:process');

class WeatherForecast {
    constructor(apiUrl) {
        this.baseUrl = apiUrl;
        this.rl = readline.createInterface({ input, output });
    }

    formatTime(timeString) {
        const year = new Date(timeString).getFullYear();
        const month = `${new Date(timeString).getDay() < 10 ? `0${new Date(timeString).getDate()}` : new Date(timeString).getDay()}`;
        const day = `${new Date(timeString).getMonth() < 10 ? `0${new Date(timeString).getMonth()}` : new Date(timeString).getMonth()}`;
        const time = timeString.match(/\d{2}:\d{2}/)[0];
        const timeOfDay = this.getTimeOfDay(timeString);

        return {currentTime: `${time} ${day}.${month}.${year}`, timeOfDay: timeOfDay};
    }

    getTimeOfDay(timeString) {
        const date = new Date(timeString);
        let dateFormat = [date.getHours(), date.getMinutes(), 0, 'Night'];

        dateFormat[2] = dateFormat[0]*3600+dateFormat[1]*60;
        if(dateFormat[2] >= 19800 && dateFormat[2] < 41400) dateFormat[3] = 'Morning';
        if(dateFormat[2] >= 41400 && dateFormat[2] < 63000) dateFormat[3] = 'Day';
        if(dateFormat[2] >= 63000 && dateFormat[2] < 84600) dateFormat[3] = 'Evening';
        
        return dateFormat[3];
    }

    weatherPrintTamplate = (jsonData) => {
        const country = jsonData.location.country;
        const cityName = jsonData.location.name;
        const region = jsonData.location.region;
        const timeZone = `+${jsonData.location.utc_offset.replace(/.\d{1}/, '')}`
        const time = this.formatTime(jsonData.location.localtime);
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
            isDay: jsonData.current.id_day === 'yes' ? `day` : 'not day',
            uv_index: `ultraviolet index: ${jsonData.current.uv_index}`,
        }
        const printTemplate = `
                --- Region info ---

        Region: --- ${country} | ${cityName} ---
        Time : --- ${time.currentTime} | TimeZone ${timeZone} ---
        ${time.timeOfDay}
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

    start(err=false) {
        if (err) {
            // console.log(err)
            console.log(`input err!`);
            this.rl.question('select city : ', (ans) => this.getWeatherByCity(ans));
        }
        this.rl.question('repeat - 1, exit - 2: ', (ans) => {
            const num = Number(ans.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, ''));
            if (num === 2) return this.rl.close();
            this.rl.question('select city : ', (ans) => this.getWeatherByCity(ans));
        });
    }

    getWeatherByCity = async (cityName) => {
        return new Promise((resolve, reject) => {
            http.get(`${this.baseUrl}/current?access_key=${process.env.API_KEY}&query=${cityName}`, (response) => {
                const { statusCode } = response;
                const contentType = response.headers['content-type'];
                let rawData = '';
                if (statusCode !== 200) {
                    const err = new Error('Request Failed.\n' + `Status Code: ${statusCode}`);
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
            this.weatherPrintTamplate(data);
            this.start();
        })
        .catch((err) => {
            this.start(err);
        })
    };
}

module.exports = new WeatherForecast(process.env.API_URL);