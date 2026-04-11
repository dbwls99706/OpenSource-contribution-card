/**
 * GitHub 기여 데이터를 SVG 카드로 생성
 *
 * @source https://github.com/dbwls99706/OpenSource-contribution-card
 */

const themes = {
  light: {
    bgGradient: ['#e8f4fc', '#f0e6fa'],
    cardBg: '#1e2130',
    cardBorder: '#2a2f45',
    title: '#1a1a2e',
    subtitle: '#22c55e',
    cardTitle: '#ffffff',
    cardText: '#a0a3b1',
    badge: '#22c55e',
    badgeText: '#ffffff',
    date: '#6b7280',
    dateIcon: '#22c55e',
    prNumber: '#60a5fa'
  },
  dark: {
    bgGradient: ['#1a1b26', '#24283b'],
    cardBg: '#2d3348',
    cardBorder: '#414868',
    title: '#c0caf5',
    subtitle: '#9ece6a',
    cardTitle: '#c0caf5',
    cardText: '#565f89',
    badge: '#9ece6a',
    badgeText: '#1a1b26',
    date: '#565f89',
    dateIcon: '#9ece6a',
    prNumber: '#7aa2f7'
  },
  nord: {
    bgGradient: ['#2e3440', '#3b4252'],
    cardBg: '#434c5e',
    cardBorder: '#4c566a',
    title: '#eceff4',
    subtitle: '#a3be8c',
    cardTitle: '#eceff4',
    cardText: '#d8dee9',
    badge: '#a3be8c',
    badgeText: '#2e3440',
    date: '#d8dee9',
    dateIcon: '#a3be8c',
    prNumber: '#88c0d0'
  },
  dracula: {
    bgGradient: ['#282a36', '#44475a'],
    cardBg: '#44475a',
    cardBorder: '#6272a4',
    title: '#f8f8f2',
    subtitle: '#50fa7b',
    cardTitle: '#f8f8f2',
    cardText: '#bd93f9',
    badge: '#50fa7b',
    badgeText: '#282a36',
    date: '#6272a4',
    dateIcon: '#50fa7b',
    prNumber: '#8be9fd'
  },
  tokyo: {
    bgGradient: ['#1a1b26', '#16161e'],
    cardBg: '#24283b',
    cardBorder: '#414868',
    title: '#c0caf5',
    subtitle: '#73daca',
    cardTitle: '#c0caf5',
    cardText: '#9aa5ce',
    badge: '#73daca',
    badgeText: '#1a1b26',
    date: '#565f89',
    dateIcon: '#73daca',
    prNumber: '#7dcfff'
  }
};

const icons = {
  check: `<path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/>`,
  github: `<path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>`,
  calendar: `<path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>`
};

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function getContributionType(labels) {
  if (!labels || labels.length === 0) return 'Merged';
  const lowerLabels = labels.map(l => l.toLowerCase());
  if (lowerLabels.some(l => l.includes('bug') || l.includes('fix'))) return 'Bug Fix';
  if (lowerLabels.some(l => l.includes('feat') || l.includes('enhancement'))) return 'Feature';
  if (lowerLabels.some(l => l.includes('doc'))) return 'Docs';
  if (lowerLabels.some(l => l.includes('test'))) return 'Tests';
  if (lowerLabels.some(l => l.includes('refactor'))) return 'Refactor';
  return 'Merged';
}

/**
 * SVG 카드 생성 - 카드 그리드 스타일
 * @param {Object} data - 기여 데이터
 * @param {Object} options - 옵션
 * @param {string} options.theme - 테마 (light, dark, nord, dracula, tokyo)
 * @param {boolean} options.autoTheme - GitHub 테마 자동 감지 (light/dark)
 * @param {number} options.maxRepos - 최대 표시 레포 수
 * @param {number} options.width - SVG 너비
 * @param {string} options.title - 커스텀 타이틀
 * @param {string} options.sortBy - 정렬 기준 (date, count)
 * @param {number} options.monthsAgo - N개월 이내 기여만 표시
 */
export function generateSVG(data, options = {}) {
  const {
    theme = 'light',
    autoTheme = false,
    maxRepos = 4,
    width = 480,
    title = 'Open-Source Contributions',
    sortBy = 'date',
    monthsAgo = null
  } = options;

  const colors = themes[theme] || themes.light;
  const ossScore = (data.totalPRs * 10) + (data.totalRepos * 20);

  // PR 단위로 펼치기 (레포별이 아닌 PR별로)
  let allPRs = [];
  for (const repo of data.contributions) {
    for (const pr of repo.prs) {
      allPRs.push({
        repoName: repo.name,
        avatarUrl: repo.avatarBase64 || repo.avatarUrl,
        prCount: repo.prs.length,
        ...pr
      });
    }
  }

  // 날짜 필터링
  if (monthsAgo && monthsAgo > 0) {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsAgo);
    allPRs = allPRs.filter(pr => {
      if (!pr.mergedAt) return false;
      return new Date(pr.mergedAt) >= cutoffDate;
    });
  }

  // 정렬
  if (sortBy === 'date') {
    allPRs.sort((a, b) => {
      const dateA = a.mergedAt ? new Date(a.mergedAt) : new Date(0);
      const dateB = b.mergedAt ? new Date(b.mergedAt) : new Date(0);
      return dateB - dateA; // 최신순
    });
  } else if (sortBy === 'count') {
    allPRs.sort((a, b) => b.prCount - a.prCount); // PR 많은 레포순
  }

  const prs = allPRs.slice(0, maxRepos);

  // 표시할 PR이 없는 경우
  if (prs.length === 0) {
    return generateEmptySVG(data.username, { theme, width, title });
  }

  // 그리드 설정
  const cols = 2;
  const rows = Math.ceil(prs.length / cols);
  const cardWidth = 205;
  const cardHeight = 95;
  const cardGap = 12;
  const padding = 18;

  // 헤더 높이
  const headerHeight = 58;

  // 전체 높이 계산
  const gridHeight = rows * cardHeight + (rows - 1) * cardGap;
  const totalHeight = headerHeight + gridHeight + padding * 2;

  // 애니메이션 스타일 (opacity만 사용, transform 충돌 방지)
  const lightColors = themes.light;
  const darkColors = themes.dark;

  const autoThemeStyles = autoTheme ? `
      /* Light mode (default) */
      .bg-start { stop-color: ${lightColors.bgGradient[0]}; }
      .bg-end { stop-color: ${lightColors.bgGradient[1]}; }
      .card-bg { fill: ${lightColors.cardBg}; }
      .icon-bg { fill: #2d3348; }
      .icon-color { fill: #ffffff; }
      .title-text { fill: ${lightColors.title}; }
      .subtitle-text { fill: ${lightColors.subtitle}; }
      .subtitle-icon { fill: ${lightColors.subtitle}; }
      .card-title { fill: ${lightColors.cardTitle}; }
      .pr-number { fill: ${lightColors.prNumber}; }
      .card-text { fill: ${lightColors.cardText}; }
      .badge-bg { fill: ${lightColors.badge}; }
      .badge-text { fill: ${lightColors.badgeText}; }
      .date-icon { fill: ${lightColors.dateIcon}; }
      .date-text { fill: ${lightColors.date}; }

      /* Dark mode */
      @media (prefers-color-scheme: dark) {
        .bg-start { stop-color: ${darkColors.bgGradient[0]}; }
        .bg-end { stop-color: ${darkColors.bgGradient[1]}; }
        .card-bg { fill: ${darkColors.cardBg}; }
        .icon-bg { fill: ${darkColors.cardBg}; }
        .icon-color { fill: #ffffff; }
        .title-text { fill: ${darkColors.title}; }
        .subtitle-text { fill: ${darkColors.subtitle}; }
        .subtitle-icon { fill: ${darkColors.subtitle}; }
        .card-title { fill: ${darkColors.cardTitle}; }
        .pr-number { fill: ${darkColors.prNumber}; }
        .card-text { fill: ${darkColors.cardText}; }
        .badge-bg { fill: ${darkColors.badge}; }
        .badge-text { fill: ${darkColors.badgeText}; }
        .date-icon { fill: ${darkColors.dateIcon}; }
        .date-text { fill: ${darkColors.date}; }
      }
  ` : '';

  const styles = `
    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .card {
        animation: fadeIn 0.4s ease-out forwards;
        opacity: 0;
      }
      ${prs.map((_, i) => `.card-${i} { animation-delay: ${i * 0.1}s; }`).join('\n      ')}
      ${autoThemeStyles}
    </style>
  `;

  // 그라데이션 배경
  const background = autoTheme ? `
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" class="bg-start"/>
        <stop offset="100%" class="bg-end"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${totalHeight}" fill="url(#bgGrad)" rx="16"/>
  ` : `
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colors.bgGradient[0]}"/>
        <stop offset="100%" style="stop-color:${colors.bgGradient[1]}"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${totalHeight}" fill="url(#bgGrad)" rx="16"/>
  `;

  // 헤더
  const header = autoTheme ? `
    <g transform="translate(${padding}, ${padding + 5})">
      <text class="title-text" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="18" font-weight="700">
        ${escapeXml(title)}
      </text>
      <g transform="translate(0, 26)">
        <svg class="subtitle-icon" width="16" height="16" viewBox="0 0 20 20">${icons.check}</svg>
        <text class="subtitle-text" x="20" y="12" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="12" font-weight="600">
          ${data.totalPRs} PR${data.totalPRs !== 1 ? 's' : ''} Merged · ${data.totalRepos} Repo${data.totalRepos !== 1 ? 's' : ''}
        </text>
      </g>
      <g transform="translate(${width - padding * 2 - 80}, 5)">
        <rect class="badge-bg" width="80" height="24" rx="12"/>
        <text class="badge-text" x="40" y="16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="11" font-weight="800" text-anchor="middle">
          Score: ${ossScore}
        </text>
      </g>
    </g>
  ` : `
    <g transform="translate(${padding}, ${padding + 5})">
      <text font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="18" font-weight="700" fill="${colors.title}">
        ${escapeXml(title)}
      </text>
      <g transform="translate(0, 26)">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="${colors.subtitle}">${icons.check}</svg>
        <text x="20" y="12" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="12" font-weight="600" fill="${colors.subtitle}">
          ${data.totalPRs} PR${data.totalPRs !== 1 ? 's' : ''} Merged · ${data.totalRepos} Repo${data.totalRepos !== 1 ? 's' : ''}
        </text>
      </g>
      <g transform="translate(${width - padding * 2 - 80}, 5)">
        <rect width="80" height="24" rx="12" fill="${colors.badge}"/>
        <text x="40" y="16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="11" font-weight="800" fill="${colors.badgeText}" text-anchor="middle">
          Score: ${ossScore}
        </text>
      </g>
    </g>
  `;

  // 카드 생성
  const cards = prs.map((pr, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = padding + col * (cardWidth + cardGap);
    const y = headerHeight + padding + row * (cardHeight + cardGap);
    const prNumber = pr.number ? `#${pr.number}` : '';
    const contributionType = getContributionType(pr.labels);

    if (autoTheme) {
      return `
      <g transform="translate(${x}, ${y})" class="card card-${index}">
        <!-- Card Background -->
        <rect class="card-bg" width="${cardWidth}" height="${cardHeight}" rx="12"/>

        <!-- Repo Icon -->
        <g transform="translate(14, 14)">
          <defs>
            <clipPath id="circleView-${index}">
              <circle cx="14" cy="14" r="14"/>
            </clipPath>
          </defs>
          <circle class="icon-bg" cx="14" cy="14" r="14"/>
          <image href="${pr.avatarUrl}" x="0" y="0" width="28" height="28" clip-path="url(#circleView-${index})"/>
        </g>

        <!-- Repo Name & PR Number -->
        <text class="card-title" x="50" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="12" font-weight="600">
          ${escapeXml(truncate(pr.repoName, 16))}
        </text>
        <text class="pr-number" x="50" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="11" font-weight="500">
          ${escapeXml(prNumber)}
        </text>

        <!-- PR Title -->
        <text class="card-text" x="50" y="52" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="10">
          ${escapeXml(truncate(pr.title, 22))}
        </text>

        <!-- Contribution Type Badge -->
        <g transform="translate(14, 70)">
          <rect class="badge-bg" width="65" height="18" rx="4"/>
          <text class="badge-text" x="32.5" y="13" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="9" font-weight="700" text-anchor="middle">
            ${escapeXml(contributionType)}
          </text>
        </g>

        <!-- Date -->
        <g transform="translate(85, 70)">
          <svg class="date-icon" width="12" height="12" viewBox="0 0 20 20">${icons.calendar}</svg>
          <text class="date-text" x="16" y="10" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="9">
            ${formatDate(pr.mergedAt)}
          </text>
        </g>
      </g>
    `;
    }

    return `
      <g transform="translate(${x}, ${y})" class="card card-${index}">
        <!-- Card Background -->
        <rect width="${cardWidth}" height="${cardHeight}" rx="12" fill="${colors.cardBg}"/>

        <!-- Repo Icon -->
        <g transform="translate(14, 14)">
          <defs>
            <clipPath id="circleView-${index}">
              <circle cx="14" cy="14" r="14"/>
            </clipPath>
          </defs>
          <circle cx="14" cy="14" r="14" fill="#2d3348"/>
          <image href="${pr.avatarUrl}" x="0" y="0" width="28" height="28" clip-path="url(#circleView-${index})"/>
        </g>

        <!-- Repo Name & PR Number -->
        <text x="50" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="12" font-weight="600" fill="${colors.cardTitle}">
          ${escapeXml(truncate(pr.repoName, 16))}
        </text>
        <text x="50" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="11" font-weight="500" fill="${colors.prNumber}">
          ${escapeXml(prNumber)}
        </text>

        <!-- PR Title -->
        <text x="50" y="52" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="10" fill="${colors.cardText}">
          ${escapeXml(truncate(pr.title, 22))}
        </text>

        <!-- Contribution Type Badge -->
        <g transform="translate(14, 70)">
          <rect width="65" height="18" rx="4" fill="${colors.badge}"/>
          <text x="32.5" y="13" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="9" font-weight="700" fill="${colors.badgeText}" text-anchor="middle">
            ${escapeXml(contributionType)}
          </text>
        </g>

        <!-- Date -->
        <g transform="translate(85, 70)">
          <svg width="12" height="12" viewBox="0 0 20 20" fill="${colors.dateIcon}">${icons.calendar}</svg>
          <text x="16" y="10" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="9" fill="${colors.date}">
            ${formatDate(pr.mergedAt)}
          </text>
        </g>
      </g>
    `;
  }).join('');

  return `
<svg width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
  ${styles}
  ${background}
  ${header}
  ${cards}
</svg>
  `.trim();
}

/**
 * 기여가 없을 때의 SVG
 */
export function generateEmptySVG(username, options = {}) {
  const { theme = 'light', autoTheme = false, width = 480, title = 'Open-Source Contributions' } = options;
  const colors = themes[theme] || themes.light;
  const lightColors = themes.light;
  const darkColors = themes.dark;

  if (autoTheme) {
    return `
<svg width="${width}" height="150" viewBox="0 0 ${width} 150" xmlns="http://www.w3.org/2000/svg">
  <style>
    .bg-start { stop-color: ${lightColors.bgGradient[0]}; }
    .bg-end { stop-color: ${lightColors.bgGradient[1]}; }
    .title-text { fill: ${lightColors.title}; }
    .card-text { fill: ${lightColors.cardText}; }

    @media (prefers-color-scheme: dark) {
      .bg-start { stop-color: ${darkColors.bgGradient[0]}; }
      .bg-end { stop-color: ${darkColors.bgGradient[1]}; }
      .title-text { fill: ${darkColors.title}; }
      .card-text { fill: ${darkColors.cardText}; }
    }
  </style>
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" class="bg-start"/>
      <stop offset="100%" class="bg-end"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="150" fill="url(#bgGrad)" rx="16"/>
  <text class="title-text" x="30" y="45" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="22" font-weight="700">
    ${escapeXml(title)}
  </text>
  <text class="card-text" x="${width / 2}" y="100" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="14" text-anchor="middle">
    No contributions yet. Start contributing
  </text>
</svg>
    `.trim();
  }

  return `
<svg width="${width}" height="150" viewBox="0 0 ${width} 150" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.bgGradient[0]}"/>
      <stop offset="100%" style="stop-color:${colors.bgGradient[1]}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="150" fill="url(#bgGrad)" rx="16"/>
  <text x="30" y="45" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="${colors.title}">
    ${escapeXml(title)}
  </text>
  <text x="${width / 2}" y="100" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="14" fill="${colors.cardText}" text-anchor="middle">
    No contributions yet. Start contributing
  </text>
</svg>
  `.trim();
}
