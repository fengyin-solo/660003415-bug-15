import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { COGNATE_SETS, LANGUAGE_FAMILIES, buildGraph } from '../mock/data'
import type { CognateSet } from '../types'
export { LANGUAGE_FAMILIES, COGNATE_SETS }

const STORAGE_KEY = 'etymology-filter-prefs'

type SortDir = 'asc' | 'desc'

interface FilterPrefs {
  family: string
  sortKey: string
  sortDir: SortDir
}

function loadPrefs(): FilterPrefs {
  const fallback: FilterPrefs = { family: 'all', sortKey: '', sortDir: 'asc' }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const p = JSON.parse(raw)
    return {
      family: LANGUAGE_FAMILIES.some(f => f.id === p.family) ? p.family : 'all',
      sortKey: typeof p.sortKey === 'string' ? p.sortKey : '',
      sortDir: p.sortDir === 'desc' ? 'desc' : 'asc',
    }
  } catch {
    return fallback
  }
}

// 统一的搜索匹配条件：概览计数、语言列表与词表共用
function matchesSearch(cs: CognateSet, q: string): boolean {
  return cs.root.toLowerCase().includes(q)
    || cs.meaning.includes(q)
    || Object.values(cs.languages).some(w => w.toLowerCase().includes(q))
}

function sortValue(cs: CognateSet, key: string): string {
  if (key === 'root') return cs.root
  if (key === 'meaning') return cs.meaning
  return cs.languages[key] || ''
}

export const useEtymologyStore = defineStore('etymology', () => {
  const graph = ref(buildGraph())
  const selectedNode = ref<any>(null)
  const searchQuery = ref('')

  // 筛选与排序状态：从 localStorage 恢复，保证返回概览页面后保持当前语系与排序
  const prefs = loadPrefs()
  const selectedFamily = ref(prefs.family)
  const sortKey = ref(prefs.sortKey)
  const sortDir = ref<SortDir>(prefs.sortDir)

  watch([selectedFamily, sortKey, sortDir], ([family, key, dir]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ family, sortKey: key, sortDir: dir }))
    } catch { /* 隐私模式等场景下忽略写入失败 */ }
  })

  // 词表行数据：只受筛选条件影响，与排序无关
  const filteredCognates = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    return COGNATE_SETS.filter(cs =>
      (selectedFamily.value === 'all' || cs.family === selectedFamily.value)
      && (!q || matchesSearch(cs, q))
    )
  })

  // 词表展示数据：在筛选结果上排序，排序不会改变任何计数
  const sortedCognates = computed(() => {
    const list = [...filteredCognates.value]
    const key = sortKey.value
    if (!key) return list
    const dir = sortDir.value === 'desc' ? -1 : 1
    return list.sort((a, b) => {
      const av = sortValue(a, key)
      const bv = sortValue(b, key)
      if (!av && !bv) return 0
      if (!av) return 1 // 缺失词形的语言列始终排在最后
      if (!bv) return -1
      return dir * av.localeCompare(bv)
    })
  })

  // 每个语系的计数：total 为数据集中收录总量，match 为当前搜索条件下的匹配量
  // 计数只依赖搜索词，不依赖语系选择与排序，保证切换排序/语系时计数不错位
  const familyCounts = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    const map: Record<string, { total: number; match: number }> = {}
    LANGUAGE_FAMILIES.forEach(f => { map[f.id] = { total: 0, match: 0 } })
    COGNATE_SETS.forEach(cs => {
      const entry = map[cs.family] ?? (map[cs.family] = { total: 0, match: 0 })
      entry.total++
      if (!q || matchesSearch(cs, q)) entry.match++
    })
    return map
  })

  // 词表语言列：与语系概览中的语言列表同源
  // 选中语系时显示该语系的语言；全部语系时显示数据集中实际出现的语言（按语系顺序）
  const tableColumns = computed(() => {
    if (selectedFamily.value !== 'all') {
      return LANGUAGE_FAMILIES.find(f => f.id === selectedFamily.value)?.languages ?? []
    }
    const present = new Set<string>()
    COGNATE_SETS.forEach(cs => Object.keys(cs.languages).forEach(l => present.add(l)))
    const ordered: string[] = []
    LANGUAGE_FAMILIES.forEach(f => f.languages.forEach(l => {
      if (present.has(l) && !ordered.includes(l)) ordered.push(l)
    }))
    present.forEach(l => { if (!ordered.includes(l)) ordered.push(l) })
    return ordered
  })

  const hasActiveFilters = computed(() => searchQuery.value.trim() !== '' || selectedFamily.value !== 'all')

  function toggleFamily(id: string) {
    selectedFamily.value = selectedFamily.value === id ? 'all' : id
  }

  function toggleSort(key: string) {
    if (sortKey.value !== key) {
      sortKey.value = key
      sortDir.value = 'asc'
    } else if (sortDir.value === 'asc') {
      sortDir.value = 'desc'
    } else {
      sortKey.value = '' // 第三次点击恢复原始顺序
    }
  }

  function clearFilters() {
    searchQuery.value = ''
    selectedFamily.value = 'all'
  }

  return {
    graph, selectedNode, searchQuery, selectedFamily, sortKey, sortDir,
    filteredCognates, sortedCognates, familyCounts, tableColumns, hasActiveFilters,
    toggleFamily, toggleSort, clearFilters,
  }
})
