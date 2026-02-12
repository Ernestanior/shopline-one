/**
 * SolisCloud API Integration
 * 用于获取光伏电站监控数据
 */

const crypto = require('crypto');
const https = require('https');

// API配置
const SOLIS_CONFIG = {
  keyId: '1300386381676661773',
  keySecret: 'eccae4b90e0e4560a412d6839ffac42e',
  apiUrl: 'https://www.soliscloud.com:13333'
};

/**
 * 生成API签名
 * @param {string} body - 请求体
 * @param {string} canonicalizedResource - 资源路径
 * @returns {string} - MD5签名
 */
function generateSignature(body, canonicalizedResource) {
  const contentMd5 = crypto.createHash('md5').update(body).digest('base64');
  const contentType = 'application/json';
  const date = new Date().toUTCString();
  
  const stringToSign = [
    'POST',
    contentMd5,
    contentType,
    date,
    canonicalizedResource
  ].join('\n');
  
  const signature = crypto
    .createHmac('sha1', SOLIS_CONFIG.keySecret)
    .update(stringToSign)
    .digest('base64');
  
  return {
    signature,
    contentMd5,
    date
  };
}

/**
 * 调用SolisCloud API
 * @param {string} endpoint - API端点
 * @param {object} data - 请求数据
 * @returns {Promise<object>} - API响应
 */
function callSolisAPI(endpoint, data = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const canonicalizedResource = endpoint;
    
    const { signature, contentMd5, date } = generateSignature(body, canonicalizedResource);
    
    const options = {
      hostname: 'www.soliscloud.com',
      port: 13333,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-MD5': contentMd5,
        'Date': date,
        'Authorization': `API ${SOLIS_CONFIG.keyId}:${signature}`
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (error) {
          reject(new Error('Failed to parse API response'));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(body);
    req.end();
  });
}

/**
 * 获取电站列表
 */
async function getStationList() {
  try {
    const response = await callSolisAPI('/v1/api/stationList', {
      pageNo: 1,
      pageSize: 20
    });
    return response;
  } catch (error) {
    console.error('获取电站列表失败:', error);
    throw error;
  }
}

/**
 * 获取电站详情
 * @param {string} stationId - 电站ID
 */
async function getStationDetail(stationId) {
  try {
    const response = await callSolisAPI('/v1/api/stationDetail', {
      id: stationId
    });
    return response;
  } catch (error) {
    console.error('获取电站详情失败:', error);
    throw error;
  }
}

/**
 * 获取逆变器列表
 * @param {string} stationId - 电站ID
 */
async function getInverterList(stationId) {
  try {
    const response = await callSolisAPI('/v1/api/inverterList', {
      stationId: stationId,
      pageNo: 1,
      pageSize: 20
    });
    return response;
  } catch (error) {
    console.error('获取逆变器列表失败:', error);
    throw error;
  }
}

/**
 * 获取逆变器实时数据
 * @param {string} inverterId - 逆变器ID
 */
async function getInverterDetail(inverterId) {
  try {
    const response = await callSolisAPI('/v1/api/inverterDetail', {
      id: inverterId
    });
    return response;
  } catch (error) {
    console.error('获取逆变器详情失败:', error);
    throw error;
  }
}

/**
 * 获取电站日发电量
 * @param {string} stationId - 电站ID
 * @param {string} date - 日期 (YYYY-MM-DD)
 */
async function getStationDay(stationId, date) {
  try {
    const response = await callSolisAPI('/v1/api/stationDay', {
      id: stationId,
      time: date
    });
    return response;
  } catch (error) {
    console.error('获取日发电量失败:', error);
    throw error;
  }
}

/**
 * 获取电站月发电量
 * @param {string} stationId - 电站ID
 * @param {string} month - 月份 (YYYY-MM)
 */
async function getStationMonth(stationId, month) {
  try {
    const response = await callSolisAPI('/v1/api/stationMonth', {
      id: stationId,
      month: month
    });
    return response;
  } catch (error) {
    console.error('获取月发电量失败:', error);
    throw error;
  }
}

/**
 * 获取电站年发电量
 * @param {string} stationId - 电站ID
 * @param {string} year - 年份 (YYYY)
 */
async function getStationYear(stationId, year) {
  try {
    const response = await callSolisAPI('/v1/api/stationYear', {
      id: stationId,
      year: year
    });
    return response;
  } catch (error) {
    console.error('获取年发电量失败:', error);
    throw error;
  }
}

module.exports = {
  getStationList,
  getStationDetail,
  getInverterList,
  getInverterDetail,
  getStationDay,
  getStationMonth,
  getStationYear,
  callSolisAPI
};
