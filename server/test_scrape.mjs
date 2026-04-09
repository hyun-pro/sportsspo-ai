import { load } from 'cheerio'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

// ── KBO 순위 ──
console.log('=== KBO 순위 스크래핑 ===')
try {
  const res = await fetch('https://www.koreabaseball.com/Record/TeamRank/TeamRankDaily.aspx', {
    headers: { 'User-Agent': UA }
  })
  const html = await res.text()
  const ch = load(html)
  const rows = ch('table.tData').first().find('tbody tr')
  console.log('KBO rows:', rows.length)
  rows.each((i, el) => {
    const tds = ch(el).find('td')
    console.log(
      tds.eq(0).text().trim(),  // rank
      tds.eq(1).text().trim(),  // team
      tds.eq(2).text().trim(),  // games
      tds.eq(3).text().trim(),  // wins
      tds.eq(4).text().trim(),  // losses
      tds.eq(5).text().trim(),  // draws
      tds.eq(6).text().trim(),  // pct
    )
  })
} catch (e) { console.error('KBO error:', e.message) }

// ── KBO 오늘 경기 (mykbostats.com) ──
console.log('\n=== KBO 오늘 경기 ===')
try {
  const res = await fetch('https://mykbostats.com', { headers: { 'User-Agent': UA } })
  const html = await res.text()
  const ch = load(html)
  ch('a.game-line').each((i, el) => {
    const away = ch(el).find('.away-team').text().trim()
    const home = ch(el).find('.home-team').text().trim()
    const status = ch(el).find('.middle .status').text().trim()
    const awayScore = ch(el).find('.score.away-score').text().trim()
    const homeScore = ch(el).find('.score.home-score').text().trim()
    const time = ch(el).find('time').attr('datetime') || ''
    console.log(`${away} @ ${home} | ${status} | ${awayScore}-${homeScore} | ${time}`)
  })
} catch (e) { console.error('mykbostats error:', e.message) }

// ── NPB 순위 ──
console.log('\n=== NPB 순위 스크래핑 ===')
try {
  const res = await fetch('https://npb.jp/bis/2026/stats/', { headers: { 'User-Agent': UA } })
  const html = await res.text()
  const ch = load(html)
  const tables = ch('table')
  console.log('Total tables:', tables.length)

  // Find ranking tables
  tables.each((i, table) => {
    const headerText = ch(table).find('th').first().text().trim()
    if (headerText.includes('順位') || headerText.includes('チーム') || ch(table).hasClass('ranking_table')) {
      console.log(`\nTable ${i}: class="${ch(table).attr('class')}" header="${headerText}"`)
      ch(table).find('tr').each((j, tr) => {
        const cells = ch(tr).find('td, th')
        const row = []
        cells.each((k, cell) => row.push(ch(cell).text().trim()))
        if (row.length > 0) console.log(row.join(' | '))
      })
    }
  })
} catch (e) { console.error('NPB error:', e.message) }

// ── NPB 오늘 일정 ──
console.log('\n=== NPB 오늘 경기 ===')
try {
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const url = `https://npb.jp/games/2026/schedule_${month}.html`
  console.log('URL:', url)
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  const html = await res.text()
  const ch = load(html)

  const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const todayShort = today.slice(4) // MMDD

  // Find today's games in score_box
  ch('a[href*="/scores/2026/"]').each((i, el) => {
    const href = ch(el).attr('href') || ''
    const text = ch(el).text().trim()
    if (href.includes(todayShort.slice(0,2) + todayShort.slice(2,4))) {
      console.log(`${text} -> ${href}`)
    }
  })

  // Also check game tables
  const todayDate = `${parseInt(month)}月${new Date().getDate()}日`
  console.log('Looking for date:', todayDate)
  ch('h4, h3, .date, caption').each((i, el) => {
    const text = ch(el).text().trim()
    if (text.includes(`${new Date().getDate()}日`)) {
      console.log('Found date header:', text)
    }
  })
} catch (e) { console.error('NPB schedule error:', e.message) }
