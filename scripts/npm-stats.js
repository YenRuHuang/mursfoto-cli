#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// 顏色和圖示配置
const colors = {
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  title: chalk.bold.cyan,
  highlight: chalk.bold.yellow
};

const icons = {
  rocket: '🚀',
  check: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  stats: '📊',
  download: '📥',
  star: '⭐',
  fork: '🍴',
  trend: '📈',
  package: '📦'
};

/**
 * 獲取套件資訊
 */
function getPackageInfo() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return {
      name: packageJson.name,
      version: packageJson.version,
      repository: packageJson.repository
    };
  } catch (error) {
    console.error(colors.error(`${icons.error} 無法讀取 package.json`));
    process.exit(1);
  }
}

/**
 * 從 NPM API 獲取套件統計資訊
 */
async function getNpmStats(packageName) {
  try {
    console.log(colors.info(`${icons.info} 獲取 NPM 套件資訊...`));
    
    // 獲取套件基本資訊
    const packageResponse = await axios.get(`https://registry.npmjs.org/${packageName}`);
    const packageData = packageResponse.data;
    
    // 獲取下載統計
    const downloadsResponse = await axios.get(`https://api.npmjs.org/downloads/range/last-month/${packageName}`);
    const downloadsData = downloadsResponse.data;
    
    // 計算統計資料
    const totalDownloads = downloadsData.downloads?.reduce((sum, day) => sum + day.downloads, 0) || 0;
    const avgDailyDownloads = totalDownloads / 30;
    
    return {
      name: packageData.name,
      version: packageData['dist-tags']?.latest || 'unknown',
      description: packageData.description || '',
      keywords: packageData.keywords || [],
      maintainers: packageData.maintainers?.length || 0,
      versions: Object.keys(packageData.versions || {}).length,
      created: new Date(packageData.time?.created).toLocaleDateString('zh-TW'),
      modified: new Date(packageData.time?.modified).toLocaleDateString('zh-TW'),
      totalDownloads,
      avgDailyDownloads: Math.round(avgDailyDownloads),
      monthlyData: downloadsData.downloads || []
    };
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(colors.warning(`${icons.warning} 套件尚未發布到 NPM`));
      return null;
    }
    throw error;
  }
}

/**
 * 從 GitHub API 獲取倉庫統計資訊
 */
async function getGitHubStats(repoUrl) {
  try {
    console.log(colors.info(`${icons.info} 獲取 GitHub 倉庫資訊...`));
    
    // 解析 GitHub URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      console.log(colors.warning(`${icons.warning} 無效的 GitHub URL`));
      return null;
    }
    
    const [, owner, repo] = match;
    const cleanRepo = repo.replace('.git', '');
    
    // 獲取倉庫資訊
    const repoResponse = await axios.get(`https://api.github.com/repos/${owner}/${cleanRepo}`);
    const repoData = repoResponse.data;
    
    // 獲取發布資訊
    let releasesData = [];
    try {
      const releasesResponse = await axios.get(`https://api.github.com/repos/${owner}/${cleanRepo}/releases`);
      releasesData = releasesResponse.data;
    } catch (error) {
      console.log(colors.warning(`${icons.warning} 無法獲取發布資訊`));
    }
    
    return {
      name: repoData.name,
      fullName: repoData.full_name,
      description: repoData.description || '',
      stars: repoData.stargazers_count || 0,
      forks: repoData.forks_count || 0,
      watchers: repoData.watchers_count || 0,
      issues: repoData.open_issues_count || 0,
      language: repoData.language || '',
      created: new Date(repoData.created_at).toLocaleDateString('zh-TW'),
      updated: new Date(repoData.updated_at).toLocaleDateString('zh-TW'),
      size: repoData.size || 0,
      releases: releasesData.length || 0,
      latestRelease: releasesData[0]?.tag_name || 'none'
    };
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(colors.warning(`${icons.warning} GitHub 倉庫未找到或為私有倉庫`));
      return null;
    }
    throw error;
  }
}

/**
 * 生成趨勢分析
 */
function generateTrendAnalysis(npmStats, githubStats) {
  const trends = [];
  
  if (npmStats) {
    if (npmStats.avgDailyDownloads > 100) {
      trends.push(`${icons.trend} NPM 下載量表現優異 (日均 ${npmStats.avgDailyDownloads} 次)`);
    } else if (npmStats.avgDailyDownloads > 10) {
      trends.push(`${icons.trend} NPM 下載量穩定成長 (日均 ${npmStats.avgDailyDownloads} 次)`);
    } else {
      trends.push(`${icons.info} NPM 下載量待提升 (日均 ${npmStats.avgDailyDownloads} 次)`);
    }
  }
  
  if (githubStats) {
    if (githubStats.stars > 100) {
      trends.push(`${icons.star} GitHub 受到社群關注 (${githubStats.stars} 星)`);
    } else if (githubStats.stars > 10) {
      trends.push(`${icons.star} GitHub 獲得初步認可 (${githubStats.stars} 星)`);
    }
    
    if (githubStats.forks > 10) {
      trends.push(`${icons.fork} 社群參與度高 (${githubStats.forks} 個分叉)`);
    }
  }
  
  return trends;
}

/**
 * 顯示統計報告
 */
function displayReport(packageInfo, npmStats, githubStats) {
  console.log(colors.title(`\n${icons.stats} @mursfoto/cli 統計報告\n`));
  
  // 套件基本資訊
  console.log(colors.title(`📦 套件資訊`));
  console.log(`${colors.info('名稱:')} ${colors.highlight(packageInfo.name)}`);
  console.log(`${colors.info('版本:')} ${colors.highlight(packageInfo.version)}`);
  console.log('');
  
  // NPM 統計
  if (npmStats) {
    console.log(colors.title(`📥 NPM 統計`));
    console.log(`${colors.info('總下載量:')} ${colors.highlight(npmStats.totalDownloads.toLocaleString())} 次`);
    console.log(`${colors.info('日均下載:')} ${colors.highlight(npmStats.avgDailyDownloads)} 次`);
    console.log(`${colors.info('版本數量:')} ${colors.highlight(npmStats.versions)} 個`);
    console.log(`${colors.info('維護者:')} ${colors.highlight(npmStats.maintainers)} 位`);
    console.log(`${colors.info('首次發布:')} ${colors.highlight(npmStats.created)}`);
    console.log(`${colors.info('最後更新:')} ${colors.highlight(npmStats.modified)}`);
    console.log('');
  } else {
    console.log(colors.warning(`${icons.warning} NPM 統計: 套件尚未發布\n`));
  }
  
  // GitHub 統計
  if (githubStats) {
    console.log(colors.title(`⭐ GitHub 統計`));
    console.log(`${colors.info('Stars:')} ${colors.highlight(githubStats.stars)} ⭐`);
    console.log(`${colors.info('Forks:')} ${colors.highlight(githubStats.forks)} 🍴`);
    console.log(`${colors.info('Watchers:')} ${colors.highlight(githubStats.watchers)} 👀`);
    console.log(`${colors.info('Issues:')} ${colors.highlight(githubStats.issues)} 🐛`);
    console.log(`${colors.info('主要語言:')} ${colors.highlight(githubStats.language)}`);
    console.log(`${colors.info('倉庫大小:')} ${colors.highlight(githubStats.size)} KB`);
    console.log(`${colors.info('發布版本:')} ${colors.highlight(githubStats.releases)} 個`);
    console.log(`${colors.info('最新發布:')} ${colors.highlight(githubStats.latestRelease)}`);
    console.log(`${colors.info('創建日期:')} ${colors.highlight(githubStats.created)}`);
    console.log(`${colors.info('最後更新:')} ${colors.highlight(githubStats.updated)}`);
    console.log('');
  } else {
    console.log(colors.warning(`${icons.warning} GitHub 統計: 倉庫資訊無法獲取\n`));
  }
  
  // 趨勢分析
  const trends = generateTrendAnalysis(npmStats, githubStats);
  if (trends.length > 0) {
    console.log(colors.title(`📈 趨勢分析`));
    trends.forEach(trend => console.log(trend));
    console.log('');
  }
  
  // 改進建議
  console.log(colors.title(`💡 改進建議`));
  if (!npmStats) {
    console.log(`${icons.info} 建議盡快發布到 NPM 以提高可見度`);
  } else if (npmStats.avgDailyDownloads < 10) {
    console.log(`${icons.info} 考慮增加市場推廣，提高套件使用率`);
  }
  
  if (githubStats) {
    if (githubStats.stars < 10) {
      console.log(`${icons.info} 完善 README 和文檔，吸引更多 GitHub Stars`);
    }
    if (githubStats.issues > 10) {
      console.log(`${icons.info} 處理待解決的 Issues，提升項目品質`);
    }
  }
  console.log('');
}

/**
 * 儲存統計資料到 JSON 檔案
 */
function saveStatsToFile(packageInfo, npmStats, githubStats) {
  const statsData = {
    timestamp: new Date().toISOString(),
    package: packageInfo,
    npm: npmStats,
    github: githubStats,
    trends: generateTrendAnalysis(npmStats, githubStats)
  };
  
  const filename = `stats-report-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(statsData, null, 2));
  console.log(colors.success(`${icons.check} 統計資料已儲存至 ${filename}`));
}

/**
 * 主要執行函數
 */
async function main() {
  console.log(colors.title(`\n${icons.rocket} @mursfoto/cli NPM 統計追蹤器\n`));
  
  try {
    // 獲取套件資訊
    const packageInfo = getPackageInfo();
    console.log(colors.info(`${icons.package} 分析套件: ${packageInfo.name}`));
    
    // 獲取 NPM 統計
    const npmStats = await getNpmStats(packageInfo.name);
    
    // 獲取 GitHub 統計
    let githubStats = null;
    if (packageInfo.repository?.url) {
      githubStats = await getGitHubStats(packageInfo.repository.url);
    }
    
    // 顯示報告
    displayReport(packageInfo, npmStats, githubStats);
    
    // 儲存統計資料
    console.log(colors.info(`${icons.info} 儲存統計資料...`));
    saveStatsToFile(packageInfo, npmStats, githubStats);
    
    console.log(colors.title(`\n${icons.rocket} 統計報告生成完成！\n`));
    
  } catch (error) {
    console.error(colors.error(`\n${icons.error} 統計資料獲取失敗：${error.message}\n`));
    if (error.response) {
      console.error(colors.error(`API 錯誤: ${error.response.status} - ${error.response.statusText}`));
    }
    process.exit(1);
  }
}

// 執行主程序
if (require.main === module) {
  main();
}

module.exports = {
  getNpmStats,
  getGitHubStats,
  generateTrendAnalysis,
  main
};
