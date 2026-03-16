#!/usr/bin/env node

/**
 * OSS Contribution Card - GitHub 프로필에 오픈소스 기여 내역 표시
 *
 * @source https://github.com/dbwls99706/oss-contribution-card
 */

import { fetchContributions, fetchFeaturedPRs } from './fetch-contributions.js';
import { generateSVG, generateEmptySVG } from './generate-svg.js';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 테스트/데모용 mock 데이터
function getMockData(username) {
  const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  return {
    username,
    totalPRs: 3,
    totalRepos: 3,
    contributions: [
      {
        name: 'ros2/rclcpp',
        owner: 'ros2',
        avatarUrl: 'https://github.com/ros2.png?size=40',
        avatarBase64: sampleBase64,
        prs: [
          {
            number: 3047,
            title: 'Add library dependency to node executable in rclcpp_components_register_node',
            url: 'https://github.com/ros2/rclcpp/pull/3047',
            mergedAt: '2026-02-02T12:00:00Z',
            labels: []
          }
        ],
        latestMerge: '2026-02-02T12:00:00Z'
      },
      {
        name: 'ros2/rclpy',
        owner: 'ros2',
        avatarUrl: 'https://github.com/ros2.png?size=40',
        avatarBase64: sampleBase64,
        prs: [
          {
            number: 1492,
            title: 'Fix: deadlock when calling rclpy.shutdown() from callbacks',
            url: 'https://github.com/ros2/rclpy/pull/1492',
            mergedAt: '2025-10-03T17:37:26Z',
            labels: ['bug', 'enhancement']
          }
        ],
        latestMerge: '2025-10-03T17:37:26Z'
      },
      {
        name: 'ros2/rosbag2',
        owner: 'ros2',
        avatarUrl: 'https://github.com/ros2.png?size=40',
        avatarBase64: sampleBase64,
        prs: [
          {
            number: 2135,
            title: 'Fix: Add null pointer check for reader_imp in the Reader constructor',
            url: 'https://github.com/ros2/rosbag2/pull/2135',
            mergedAt: '2025-08-14T11:10:31Z',
            labels: ['bug']
          }
        ],
        latestMerge: '2025-08-14T11:10:31Z'
      }
    ]
  };
}

async function main() {
  // 환경변수 또는 인자에서 설정 가져오기
  const username = process.env.GITHUB_USERNAME || process.argv[2];
  const token = process.env.GITHUB_TOKEN || null;
  const theme = process.env.THEME || 'light';
  const autoTheme = process.env.AUTO_THEME === 'true'; // GitHub 테마 자동 감지
  const maxRepos = parseInt(process.env.MAX_REPOS || '6', 10);
  const outputPath = process.env.OUTPUT_PATH || './contributions.svg';
  const title = process.env.TITLE || 'Open-Source Contributions';
  const sortBy = process.env.SORT_BY || 'date'; // 'date' or 'count'
  const monthsAgo = process.env.MONTHS_AGO ? parseInt(process.env.MONTHS_AGO, 10) : null;
  const excludeOrgs = process.env.EXCLUDE_ORGS ? process.env.EXCLUDE_ORGS.split(',').map(s => s.trim()).filter(Boolean) : [];
  const includeOrgs = process.env.INCLUDE_ORGS ? process.env.INCLUDE_ORGS.split(',').map(s => s.trim()).filter(Boolean) : [];
  const featuredPrsPath = process.env.FEATURED_PRS_PATH || './featured-prs.json';
  const useMock = process.env.USE_MOCK === 'true' || process.argv.includes('--mock');
  const previewThemes = process.env.PREVIEW_THEMES ? process.env.PREVIEW_THEMES.split(',').map(s => s.trim()).filter(Boolean) : [];

  if (!username) {
    console.error('Error: GitHub username is required.');
    console.error('Usage: GITHUB_USERNAME=<username> npm run generate');
    console.error('   or: node src/index.js <username>');
    process.exit(1);
  }

  console.log(`Fetching contributions for: ${username}`);
  console.log(`Theme: ${autoTheme ? 'auto (light/dark)' : theme}, Max repos: ${maxRepos}, Sort: ${sortBy}`);
  if (monthsAgo) {
    console.log(`Filtering: Last ${monthsAgo} months only`);
  }
  if (excludeOrgs.length > 0) {
    console.log(`Excluding orgs: ${excludeOrgs.join(', ')}`);
  }
  if (includeOrgs.length > 0) {
    console.log(`Including only orgs: ${includeOrgs.join(', ')}`);
  }

  try {
    let data;

    if (useMock) {
      data = getMockData(username);
    } else {
      data = await fetchContributions(username, token, { excludeOrgs, includeOrgs });
    }

    // featured-prs.json이 존재하면 카드에 표시할 PR을 해당 파일 기준으로 교체
    if (!useMock && existsSync(featuredPrsPath)) {
      try {
        const raw = readFileSync(featuredPrsPath, 'utf-8');
        const prList = JSON.parse(raw);

        if (Array.isArray(prList) && prList.length > 0) {
          console.log(`\nFeatured PRs mode: loading ${prList.length} PR(s) from ${featuredPrsPath}`);
          const featuredContributions = await fetchFeaturedPRs(prList, token);

          // totalPRs, totalRepos는 기존 API 결과 유지, contributions만 교체
          data = {
            ...data,
            contributions: featuredContributions
          };
        }
      } catch (parseErr) {
        console.warn(`Warning: Failed to parse ${featuredPrsPath}: ${parseErr.message}. Using default mode.`);
      }
    }

    console.log(`Found ${data.totalPRs} merged PRs in ${data.totalRepos} external repositories`);

    if (data.contributions.length > 0) {
      console.log('\nTop contributions:');
      data.contributions.slice(0, 5).forEach(repo => {
        console.log(`  - ${repo.name}: ${repo.prs.length} PR(s)`);
      });
    }

    // SVG 생성
    const svg = data.totalRepos > 0
      ? generateSVG(data, { theme, autoTheme, maxRepos, title, sortBy, monthsAgo })
      : generateEmptySVG(username, { theme, autoTheme, title });

    // 출력 디렉토리 생성 (필요시)
    const outputDir = dirname(outputPath);
    if (outputDir && outputDir !== '.' && !existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // 파일 저장
    writeFileSync(outputPath, svg);
    console.log(`\nSVG saved to: ${outputPath}`);

    // Preview 테마 SVG 생성 (README용)
    if (previewThemes.length > 0) {
      console.log(`\nGenerating preview themes: ${previewThemes.join(', ')}`);
      for (const previewTheme of previewThemes) {
        const previewSvg = data.totalRepos > 0
          ? generateSVG(data, { theme: previewTheme, autoTheme: false, maxRepos, title, sortBy, monthsAgo })
          : generateEmptySVG(username, { theme: previewTheme, autoTheme: false, title });

        const previewPath = `./contributions-${previewTheme}.svg`;
        writeFileSync(previewPath, previewSvg);
        console.log(`SVG saved to: ${previewPath}`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
