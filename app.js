const https = require('https'); 
const readline = require('readline');
const axios = require('axios');



function calculateTimeStats(logData) {
  const lines = logData.split('\n').filter(line => line.trim());
  const timestamps = lines.map(line => new Date(line.split(' ')[0]));
  
  return {
    startTime: new Date(Math.min(...timestamps)),
    endTime: new Date(Math.max(...timestamps)),
    totalRequests: lines.length
  };
}

function analyzeEndpointResponseTimes(logData) {
  const endpoints = new Map();

  const lines = logData.split('\n');
  
  lines.forEach(line => {
    if (line.trim()) {
      const parts = line.split(' ');
      if (parts.length >= 5) {
        const method = parts[1];
        const path = parts[2];
        const endpoint = `${method} ${path}`;
        const responseTime = parseInt(parts[4]);

        if (!isNaN(responseTime)) {
          if (!endpoints.has(endpoint)) {
            endpoints.set(endpoint, {
              totalTime: 0,
              count: 0,
              averageTime: 0,
              minTime: Infinity,
              maxTime: -Infinity
            });
          }
          
          const stats = endpoints.get(endpoint);
          stats.totalTime += responseTime;
          stats.count++;
          stats.averageTime = stats.totalTime / stats.count;
          stats.minTime = Math.min(stats.minTime, responseTime);
          stats.maxTime = Math.max(stats.maxTime, responseTime);
        }
      }
    }
  });

  return Array.from(endpoints.entries())
    .map(([endpoint, stats]) => ({
      endpoint,
      ...stats
    }))
    .sort((a, b) => b.averageTime - a.averageTime);
}

function groupStatusCodes(logData) {
  const statusGroups = {
    '2xx': 0,
    '4xx': 0,
    '5xx': 0,
    'other': 0
  };

  const lines = logData.split('\n');
  
  lines.forEach(line => {
    if (line.trim()) {
      const parts = line.split(' ');
      if (parts.length >= 4) {
        const statusCode = parseInt(parts[3]);
        
        if (statusCode >= 200 && statusCode < 300) {
          statusGroups['2xx']++;
        } else if (statusCode >= 400 && statusCode < 500) {
          statusGroups['4xx']++;
        } else if (statusCode >= 500 && statusCode < 600) {
          statusGroups['5xx']++;
        } else {
          statusGroups['other']++;
        }
      }
    }
  });

  return statusGroups;
}

function generateSummaryReport(logData) {
  const timeStats = calculateTimeStats(logData);
  const statusGroups = groupStatusCodes(logData);
  const endpointStats = analyzeEndpointResponseTimes(logData);

  const totalRequests = timeStats.totalRequests;
  const duration = (timeStats.endTime - timeStats.startTime) / 1000; 
  const requestsPerSecond = totalRequests / duration;


  console.log('\n Time Range');
  console.log(`Start Time: ${timeStats.startTime.toISOString()}`);
  console.log(`End Time:   ${timeStats.endTime.toISOString()}`);
  console.log(`Duration:   ${duration.toFixed(2)} seconds`);

  console.log('\n 1.soru cevabı');
  console.log(`Total Requests:${totalRequests}`);

  console.log('\n 2.soru cevabı');
  Object.entries(statusGroups).forEach(([group, count]) => {
    const ort = ((count / totalRequests) * 100).toFixed(1);
    console.log(`${group}: ${count} requests (${ort}%)`);
  });

  console.log('\n 3.soru cevabı');
  endpointStats.slice(0, 3).forEach((endpoint, index) => {
    console.log(`${index + 1}. ${endpoint.endpoint}`);
    console.log(`   Average: ${endpoint.averageTime.toFixed(2)}ms`);
    console.log(`   Min: ${endpoint.minTime}ms`);
    console.log(`   Max: ${endpoint.maxTime}ms`);
    console.log(`   Requests: ${endpoint.count}`);
    if (index < 2) console.log('');
  });

  console.log('\n 4. soru ceavbı');
  const mostActiveEndpoints = [...endpointStats]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  
  mostActiveEndpoints.forEach((endpoint, index) => {
    const ort = ((endpoint.count / totalRequests) * 100).toFixed(1);
    console.log(`${index + 1}. ${endpoint.endpoint}`);
    console.log(`   Requests: ${endpoint.count} (${ort}% of total traffic)`);
    console.log(`   Average Response Time: ${endpoint.averageTime.toFixed(2)}ms`);
    if (index < 2) console.log('');
  });
}

const url = 'https://gist.githubusercontent.com/adamdilek/0ec662f0bd943ae586a18399de2fe92c/raw/0a87525db9651c8e36b97239fe9acfa9d2ba82b2/app.log';

axios.get(url)
  .then(response => {
    generateSummaryReport(response.data);
  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });
 
 
  