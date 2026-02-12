#!/usr/bin/env node

/**
 * Solar API Test Script
 * 测试SolisCloud API集成
 * 
 * 使用方法:
 * node test-solar-api.js
 */

const solisAPI = require('./server/soliscloud-api');

async function testSolarAPI() {
  console.log('🌞 开始测试 SolisCloud API...\n');

  try {
    // 测试1: 获取电站列表
    console.log('📋 测试1: 获取电站列表');
    console.log('调用: getStationList()');
    const stations = await solisAPI.getStationList();
    console.log('✅ 成功!');
    console.log('响应:', JSON.stringify(stations, null, 2));
    console.log('\n' + '='.repeat(60) + '\n');

    // 如果有电站，继续测试其他API
    if (stations && stations.data && stations.data.records && stations.data.records.length > 0) {
      const stationId = stations.data.records[0].id;
      console.log(`使用电站ID: ${stationId} 进行后续测试\n`);

      // 测试2: 获取电站详情
      console.log('📋 测试2: 获取电站详情');
      console.log(`调用: getStationDetail('${stationId}')`);
      const stationDetail = await solisAPI.getStationDetail(stationId);
      console.log('✅ 成功!');
      console.log('响应:', JSON.stringify(stationDetail, null, 2));
      console.log('\n' + '='.repeat(60) + '\n');

      // 测试3: 获取逆变器列表
      console.log('📋 测试3: 获取逆变器列表');
      console.log(`调用: getInverterList('${stationId}')`);
      const inverters = await solisAPI.getInverterList(stationId);
      console.log('✅ 成功!');
      console.log('响应:', JSON.stringify(inverters, null, 2));
      console.log('\n' + '='.repeat(60) + '\n');

      // 测试4: 获取今日发电量
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      console.log('📋 测试4: 获取今日发电量');
      console.log(`调用: getStationDay('${stationId}', '${today}')`);
      const dayData = await solisAPI.getStationDay(stationId, today);
      console.log('✅ 成功!');
      console.log('响应:', JSON.stringify(dayData, null, 2));
      console.log('\n' + '='.repeat(60) + '\n');

      // 测试5: 获取本月发电量
      const thisMonth = today.substring(0, 7); // YYYY-MM
      console.log('📋 测试5: 获取本月发电量');
      console.log(`调用: getStationMonth('${stationId}', '${thisMonth}')`);
      const monthData = await solisAPI.getStationMonth(stationId, thisMonth);
      console.log('✅ 成功!');
      console.log('响应:', JSON.stringify(monthData, null, 2));
      console.log('\n' + '='.repeat(60) + '\n');

      // 测试6: 获取今年发电量
      const thisYear = today.substring(0, 4); // YYYY
      console.log('📋 测试6: 获取今年发电量');
      console.log(`调用: getStationYear('${stationId}', '${thisYear}')`);
      const yearData = await solisAPI.getStationYear(stationId, thisYear);
      console.log('✅ 成功!');
      console.log('响应:', JSON.stringify(yearData, null, 2));
      console.log('\n' + '='.repeat(60) + '\n');
    }

    console.log('🎉 所有测试完成!');
    console.log('\n✅ SolisCloud API集成正常工作');
    console.log('\n📝 API端点已添加到服务器:');
    console.log('   - GET /api/solar/stations');
    console.log('   - GET /api/solar/stations/:id');
    console.log('   - GET /api/solar/stations/:id/inverters');
    console.log('   - GET /api/solar/inverters/:id');
    console.log('   - GET /api/solar/stations/:id/day/:date');
    console.log('   - GET /api/solar/stations/:id/month/:month');
    console.log('   - GET /api/solar/stations/:id/year/:year');
    console.log('\n💡 提示: 启动服务器后可以通过HTTP请求访问这些端点');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('\n错误详情:', error);
    console.log('\n⚠️  可能的原因:');
    console.log('   1. API密钥配置错误');
    console.log('   2. 网络连接问题');
    console.log('   3. SolisCloud服务不可用');
    console.log('   4. 账户没有电站数据');
    console.log('\n💡 建议:');
    console.log('   - 检查 server/soliscloud-api.js 中的API密钥');
    console.log('   - 确认网络可以访问 https://www.soliscloud.com:13333');
    console.log('   - 登录SolisCloud网站确认账户状态');
  }
}

// 运行测试
testSolarAPI();
