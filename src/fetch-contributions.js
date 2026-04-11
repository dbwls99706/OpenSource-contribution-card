/**
 * GitHub API를 사용하여 외부 레포에 merged된 PR 목록을 가져옴
 *
 * @source https://github.com/dbwls99706/OpenSource-contribution-card
 */

import https from 'https';

const REQUEST_TIMEOUT = 30000; // 30초

function httpsGet(url, headers, retries = 3, returnBuffer = false) {
  return new Promise((resolve, reject) => {
    const makeRequest = (attempt, currentUrl) => {
      const options = {
        headers: {
          ...headers,
          'User-Agent': 'github-contribution-widget'
        },
        timeout: REQUEST_TIMEOUT
      };

      const req = https.get(currentUrl || url, options, (res) => {
        if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
          if (attempt < retries) {
            makeRequest(attempt + 1, res.headers.location);
          } else {
            reject(new Error('Too many redirects'));
          }
          return;
        }

        if (returnBuffer) {
          const chunks = [];
          res.on('data', chunk => chunks.push(chunk));
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(Buffer.concat(chunks));
            } else {
              reject(new Error(`Failed to fetch buffer: ${res.statusCode}`));
            }
          });
          return;
        }

        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          // 성공
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error('Failed to parse JSON response'));
            }
            return;
          }

          // Rate limit 처리
          if (res.statusCode === 403) {
            const rateLimitRemaining = res.headers['x-ratelimit-remaining'];
            const rateLimitReset = res.headers['x-ratelimit-reset'];
            if (rateLimitRemaining === '0') {
              const resetDate = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000) : null;
              reject(new Error(`GitHub API rate limit exceeded. Resets at: ${resetDate ? resetDate.toISOString() : 'unknown'}`));
              return;
            }
          }

          // 인증 오류
          if (res.statusCode === 401) {
            reject(new Error('GitHub API authentication failed. Please check your token.'));
            return;
          }

          // 서버 오류 시 재시도
          if (res.statusCode >= 500 && attempt < retries) {
            const delay = Math.pow(2, attempt) * 1000;
            setTimeout(() => makeRequest(attempt + 1), delay);
            return;
          }

          reject(new Error(`GitHub API error: ${res.statusCode}`));
        });
      });

      req.on('error', (err) => {
        // 네트워크 오류 시 재시도
        if (attempt < retries && (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'EAI_AGAIN')) {
          const delay = Math.pow(2, attempt) * 1000;
          setTimeout(() => makeRequest(attempt + 1), delay);
          return;
        }
        reject(new Error(`Network error: ${err.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000;
          setTimeout(() => makeRequest(attempt + 1), delay);
          return;
        }
        reject(new Error('Request timed out'));
      });
    };

    makeRequest(0);
  });
}

async function fetchAvatarAsBase64(url) {
  try {
    const buffer = await httpsGet(url, {}, 2, true);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.warn(`Warning: Failed to fetch avatar ${url}: ${err.message}`);
    return null;
  }
}

export async function fetchContributions(username, token = null, options = {}) {
  const { excludeOrgs = [], includeOrgs = [] } = options;

  // 입력 검증
  if (!username || typeof username !== 'string') {
    throw new Error('Username is required and must be a string');
  }

  const sanitizedUsername = username.trim();
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(sanitizedUsername)) {
    throw new Error('Invalid GitHub username format');
  }

  const headers = {
    'Accept': 'application/vnd.github.v3+json'
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  // 자신의 레포를 제외한 merged PR만 검색
  const query = encodeURIComponent(`author:${sanitizedUsername} type:pr is:merged -user:${sanitizedUsername}`);

  // GitHub Search API는 최대 1000개 결과(10페이지 × 100)까지 지원
  const PER_PAGE = 100;
  const MAX_PAGES = 10;
  const allItems = [];
  let searchTotalCount = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `https://api.github.com/search/issues?q=${query}&per_page=${PER_PAGE}&page=${page}&sort=updated`;

    let data;
    try {
      data = await httpsGet(url, headers);
    } catch (err) {
      throw new Error(`Failed to fetch contributions: ${err.message}`);
    }

    // 응답 데이터 검증
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response from GitHub API');
    }

    if (page === 1) {
      searchTotalCount = data.total_count || 0;
    }

    const pageItems = Array.isArray(data.items) ? data.items : [];
    allItems.push(...pageItems);

    // 마지막 페이지(전체보다 적게 받으면 더 가져올 게 없음)
    if (pageItems.length < PER_PAGE) break;
  }

  // 레포별로 그룹화
  const repoMap = new Map();

  for (const item of allItems) {
    // 필수 필드 검증
    if (!item || !item.repository_url) {
      continue;
    }

    // repository_url에서 owner/repo 추출
    const repoFullName = item.repository_url.replace('https://api.github.com/repos/', '');

    if (!repoFullName || repoFullName === item.repository_url) {
      continue; // 잘못된 URL 형식 스킵
    }

    // org/user 필터링
    const orgName = repoFullName.split('/')[0].toLowerCase();

    // includeOrgs가 설정되어 있으면 해당 org만 포함
    if (includeOrgs.length > 0) {
      if (!includeOrgs.map(o => o.toLowerCase()).includes(orgName)) {
        continue;
      }
    }

    // excludeOrgs에 포함된 org는 제외
    if (excludeOrgs.length > 0) {
      if (excludeOrgs.map(o => o.toLowerCase()).includes(orgName)) {
        continue;
      }
    }

    if (!repoMap.has(repoFullName)) {
      const owner = repoFullName.split('/')[0];
      const avatarUrl = `https://github.com/${owner}.png?size=40`;
      
      repoMap.set(repoFullName, {
        name: repoFullName,
        owner: owner,
        avatarUrl: avatarUrl,
        avatarBase64: null,
        prs: [],
        latestMerge: null
      });
    }

    const repo = repoMap.get(repoFullName);
    const mergedAt = item.pull_request?.merged_at || null;
    
    const labels = Array.isArray(item.labels) ? item.labels.map(l => l.name) : [];

    repo.prs.push({
      number: item.number || 0,
      title: item.title || 'Untitled PR',
      url: item.html_url || '',
      mergedAt: mergedAt,
      labels: labels
    });

    // 가장 최근 merge 날짜 업데이트
    if (mergedAt && (!repo.latestMerge || new Date(mergedAt) > new Date(repo.latestMerge))) {
      repo.latestMerge = mergedAt;
    }
  }

  // 배열로 변환하고 PR 수 기준 정렬
  const contributions = Array.from(repoMap.values())
    .sort((a, b) => b.prs.length - a.prs.length);

  const topRepos = contributions.slice(0, 10);
  await Promise.all(topRepos.map(async (repo) => {
    repo.avatarBase64 = await fetchAvatarAsBase64(repo.avatarUrl);
  }));

  // totalPRs는 필터링 이후 실제 카운트로 계산 (include/exclude org가 있을 때도 카드 값과 일치시킴)
  // 필터가 없고 결과가 1000개 제한에 도달하지 않은 경우엔 searchTotalCount와 동일
  const hasOrgFilter = includeOrgs.length > 0 || excludeOrgs.length > 0;
  const filteredTotalPRs = contributions.reduce((sum, r) => sum + r.prs.length, 0);
  const totalPRs = hasOrgFilter ? filteredTotalPRs : Math.max(filteredTotalPRs, searchTotalCount);

  return {
    username: sanitizedUsername,
    totalPRs,
    totalRepos: contributions.length,
    contributions
  };
}

/**
 * 개별 PR 정보를 GitHub API로 조회
 */
async function fetchSinglePR({ owner, repo, prNumber, headers }) {
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${prNumber}`;

  let data;
  try {
    data = await httpsGet(url, headers);
  } catch (err) {
    throw new Error(`Failed to fetch ${owner}/${repo}#${prNumber}: ${err.message}`);
  }

  if (!data || typeof data !== 'object' || !data.number) {
    throw new Error(`Invalid response for ${owner}/${repo}#${prNumber}: missing required fields`);
  }

  const labels = Array.isArray(data.labels) ? data.labels.map(l => l.name) : [];

  return {
    number: data.number,
    title: data.title ?? 'Untitled PR',
    url: data.html_url ?? '',
    mergedAt: data.merged_at ?? null,
    labels
  };
}

/**
 * featured-prs.json에 지정된 PR만 개별 조회하여 contributions 형태로 반환
 * @param {string[]} prList - ["org/repo#123", ...] 형태의 배열
 * @param {string|null} token - GitHub API 토큰
 * @returns {Object[]} contributions 배열
 */
export async function fetchFeaturedPRs(prList, token = null) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json'
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  // PR 항목 파싱
  const parsed = [];
  for (const entry of prList) {
    const match = entry.match(/^([^/]+\/[^#]+)#(\d+)$/);
    if (!match) {
      console.warn(`Warning: Invalid featured PR format "${entry}", expected "owner/repo#number". Skipping.`);
      continue;
    }
    const repoFullName = match[1];
    const prNumber = parseInt(match[2], 10);
    const [owner, repo] = repoFullName.split('/');
    parsed.push({ entry, repoFullName, owner, repo, prNumber });
  }

  // 병렬로 API 호출
  const results = await Promise.allSettled(
    parsed.map(({ owner, repo, prNumber }) =>
      fetchSinglePR({ owner, repo, prNumber, headers })
    )
  );

  // 결과를 레포별로 그룹화
  const repoMap = new Map();
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const { entry, repoFullName } = parsed[i];

    if (result.status === 'rejected') {
      console.warn(`Warning: Failed to fetch ${entry}: ${result.reason.message}. Skipping.`);
      continue;
    }

    const pr = result.value;

    if (!repoMap.has(repoFullName)) {
      const owner = repoFullName.split('/')[0];
      const avatarUrl = `https://github.com/${owner}.png?size=40`;

      repoMap.set(repoFullName, {
        name: repoFullName,
        owner,
        avatarUrl,
        avatarBase64: null,
        prs: [],
        latestMerge: null
      });
    }

    const repoEntry = repoMap.get(repoFullName);
    repoEntry.prs.push(pr);

    if (pr.mergedAt && (!repoEntry.latestMerge || new Date(pr.mergedAt) > new Date(repoEntry.latestMerge))) {
      repoEntry.latestMerge = pr.mergedAt;
    }
  }

  // 아바타 이미지를 병렬로 가져오기
  const contributions = Array.from(repoMap.values());
  await Promise.all(contributions.map(async (repo) => {
    repo.avatarBase64 = await fetchAvatarAsBase64(repo.avatarUrl);
  }));

  return contributions;
}
