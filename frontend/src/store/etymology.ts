import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { COGNATE_SETS, LANGUAGE_FAMILIES, buildGraph } from '../mock/data'
import type { CognateSet } from '../types'
export { LANGUAGE_FAMILIES, COGNATE_SETS }

export type ViewName = 'overview' | 'wordlist'
export type SortKey = 'root' | 'meaning'
export type EmptyReason = 'none' | 'not-collected' | 'no-match'

export interface LanguageStat {
  lang: string
  total: number
  matched: number
}
export interface FamilyStat {
  id: string
  name: string
  color: string
  era: string
  total: number
  matched: number
  languages: LanguageStat[]
}

/** 唯一的搜索匹配规则：词根 / 含义 / 任一语言词形命中即可 */
function matchesQuery(cs: CognateSet, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase()
  if (!q) return true
  return (
    cs.root.toLowerCase().includes(q) ||
    cs.meaning.toLowerCase().includes(q) ||
    Object.values(cs.languages).some((w: string) => w.toLowerCase().includes(q))
  )
}

function countLanguages(sets: CognateSet[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const cs of sets) {
    for (const [lang, word] of Object.entries(cs.languages)) {
      if (word) counts.set(lang, (counts.get(lang) ?? 0) + 1)
    }
  }
  return counts
}

export const useEtymologyStore = defineStore('etymology', () => {
  const graph = ref(buildGraph())
  const selectedNode = ref<any>(null)

  // —— 全应用共享的同一份筛选/视图状态（概览、语言列表、词表都从这里派生）——
  const view = ref<ViewName>('overview')
  const searchQuery = ref('')
  const selectedFamily = ref<string>('all')
  const sortKey = ref<SortKey>('root')
  const sortAsc = ref(true)

  /** 仅受搜索词影响的匹配结果（不受语系选择影响），概览各语系计数以此为准 */
  const searchMatched = computed(() =>
    COGNATE_SETS.filter(cs => matchesQuery(cs, searchQuery.value))
  )

  /** 概览：每个语系「当前匹配数 / 收录总数」+ 各语言的同一组计数 */
  const familyStats = computed<FamilyStat[]>(() =>
    LANGUAGE_FAMILIES.map(family => {
      const inFamily = COGNATE_SETS.filter(cs => cs.family === family.id)
      const matchedInFamily = searchMatched.value.filter(cs => cs.family === family.id)
      const totals = countLanguages(inFamily)
      const matchedCounts = countLanguages(matchedInFamily)
      return {
        id: family.id,
        name: family.name,
        color: family.color,
        era: family.era,
        total: inFamily.length,
        matched: matchedInFamily.length,
        languages: family.languages.map(lang => ({
          lang,
          total: totals.get(lang) ?? 0,
          matched: matchedCounts.get(lang) ?? 0,
        })),
      }
    })
  )

  /** 词表：搜索 + 语系共同筛选后的结果。计数唯一数据源，与排序完全无关 */
  const filteredCognates = computed(() =>
    selectedFamily.value === 'all'
      ? searchMatched.value.slice()
      : searchMatched.value.filter(cs => cs.family === selectedFamily.value)
  )

  /** 仅用于展示：在筛选结果上做稳定排序，length 永远等于 filteredCognates.length */
  const sortedCognates = computed(() => {
    const rows = filteredCognates.value.slice()
    const key = sortKey.value
    const dir = sortAsc.value ? 1 : -1
    rows.sort((a, b) => {
      const r = a[key].localeCompare(b[key], 'zh-Hans-CN', { numeric: true, sensitivity: 'base' })
      return r === 0 ? 0 : r * dir
    })
    return rows
  })

  const resultCount = computed(() => filteredCognates.value.length)

  const activeFamily = computed(() =>
    LANGUAGE_FAMILIES.find(f => f.id === selectedFamily.value) ?? null
  )
  const scopeTotal = computed(() =>
    selectedFamily.value === 'all'
      ? COGNATE_SETS.length
      : COGNATE_SETS.filter(cs => cs.family === selectedFamily.value).length
  )
  const scopeLabel = computed(() => (activeFamily.value ? activeFamily.value.name : '全部语系'))

  /**
   * 空结果语义：
   * - not-collected：该语系在词库中根本没有词根（未收录）
   * - no-match：语系有收录，但当前搜索词下没有命中（暂未匹配）
   */
  const emptyReason = computed<EmptyReason>(() => {
    if (resultCount.value > 0) return 'none'
    return scopeTotal.value === 0 ? 'not-collected' : 'no-match'
  })

  /** 力导向图需要高亮的词根节点 id，同样来自这份筛选条件 */
  const activeRootIds = computed<Set<string>>(() => {
    const wanted = new Set(filteredCognates.value)
    const ids = new Set<string>()
    COGNATE_SETS.forEach((cs, i) => {
      if (wanted.has(cs)) ids.add('root_' + i)
    })
    return ids
  })

  function setView(v: ViewName) {
    view.value = v
  }

  /** 从概览选择某语系：应用同一筛选条件并进入词表 */
  function selectFamily(id: string) {
    selectedFamily.value = id
    view.value = 'wordlist'
  }

  /** 清空筛选条件（保留排序），所有计数与列表同步刷新 */
  function clearFilters() {
    searchQuery.value = ''
    selectedFamily.value = 'all'
  }

  return {
    graph,
    selectedNode,
    view,
    searchQuery,
    selectedFamily,
    sortKey,
    sortAsc,
    searchMatched,
    familyStats,
    filteredCognates,
    sortedCognates,
    resultCount,
    activeFamily,
    scopeTotal,
    scopeLabel,
    emptyReason,
    activeRootIds,
    setView,
    selectFamily,
    clearFilters,
  }
})
