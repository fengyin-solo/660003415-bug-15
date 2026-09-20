<template>
  <div class="min-h-screen bg-slate-900 text-slate-200">
    <header class="border-b border-slate-700 px-6 py-4">
      <h1 class="text-2xl font-bold text-cyan-400">语言词源图谱与多语系演化追踪</h1>
      <p class="text-sm text-slate-500 mt-1">D3.js力导向图 · 印欧语系演化 · 同源词对照 · 500+词根</p>
    </header>
    <div class="p-4 space-y-4">
      <div class="grid lg:grid-cols-3 gap-4">
        <div class="lg:col-span-2 bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-slate-400">词源力导向网络</h3>
            <div class="flex gap-3 text-xs">
              <span v-for="f in LANGUAGE_FAMILIES" :key="f.id" class="flex items-center gap-1">
                <span class="w-3 h-3 rounded-full" :style="{backgroundColor: f.color}"></span>{{ f.name }}
              </span>
            </div>
          </div>
          <svg ref="svgRef" class="w-full bg-slate-900 rounded" style="height:460px"></svg>
        </div>
        <div class="space-y-4">
          <div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-bold text-slate-400">语系概览</h3>
              <span class="text-xs text-slate-500">匹配 {{ store.filteredCognates.length }} 条</span>
            </div>
            <div class="space-y-1">
              <div v-for="f in LANGUAGE_FAMILIES" :key="f.id"
                class="flex items-start gap-2 text-sm rounded px-2 py-1.5 -mx-2 cursor-pointer transition-colors"
                :class="store.selectedFamily === f.id ? 'bg-slate-700 ring-1 ring-cyan-500/60' : 'hover:bg-slate-700/50'"
                @click="store.toggleFamily(f.id)">
                <span class="w-3 h-3 rounded-full mt-1 flex-shrink-0" :style="{backgroundColor: f.color}"></span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <span class="font-bold">{{ f.name }}</span>
                    <span v-if="!store.familyCounts[f.id] || store.familyCounts[f.id].total === 0" class="text-xs text-slate-500 flex-shrink-0">未收录</span>
                    <span v-else-if="store.familyCounts[f.id].match === 0" class="text-xs text-amber-400 flex-shrink-0">暂未匹配</span>
                    <span v-else class="text-xs font-mono text-cyan-400 flex-shrink-0">{{ store.familyCounts[f.id].match }}/{{ store.familyCounts[f.id].total }}</span>
                  </div>
                  <div class="text-xs text-slate-500">{{ f.era }} · {{ f.languages.join('/') }}</div>
                </div>
              </div>
            </div>
            <p class="text-xs text-slate-600 mt-2">点击语系可筛选词表，再次点击取消筛选</p>
          </div>
          <div v-if="store.selectedNode" class="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 class="text-sm font-bold text-slate-400 mb-2">选中节点</h3>
            <div class="text-lg font-bold text-cyan-400">{{ store.selectedNode.word }}</div>
            <div class="text-sm text-slate-400">{{ store.selectedNode.language }} — {{ store.selectedNode.meaning }}</div>
          </div>
          <div class="bg-slate-800 rounded-lg p-4 border border-slate-700 text-xs text-slate-400">
            <h3 class="text-sm font-bold text-slate-400 mb-2">Grimm定律</h3>
            <div class="space-y-1">
              <div class="bg-slate-900 rounded p-2"><span class="text-cyan-400">p→f: </span>pater → father</div>
              <div class="bg-slate-900 rounded p-2"><span class="text-green-400">t→θ: </span>tres → three</div>
              <div class="bg-slate-900 rounded p-2"><span class="text-orange-400">k→h: </span>cord → heart</div>
            </div>
          </div>
        </div>
      </div>
      <div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold text-slate-400">同源词对照表</h3>
          <span class="text-xs text-slate-500">共 {{ store.filteredCognates.length }} 条</span>
        </div>
        <div class="flex gap-2 mb-3">
          <input v-model="store.searchQuery" placeholder="搜索词根/含义..." class="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-500" />
          <select v-model="store.selectedFamily" class="bg-slate-900 border border-slate-600 rounded px-2 text-sm text-slate-300">
            <option value="all">全部语系</option>
            <option v-for="f in LANGUAGE_FAMILIES" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select>
          <button v-if="store.hasActiveFilters" @click="store.clearFilters()"
            class="bg-slate-900 border border-slate-600 rounded px-3 text-sm text-slate-400 hover:text-cyan-400 hover:border-cyan-500">
            清空
          </button>
        </div>
        <div class="overflow-x-auto max-h-64 overflow-y-auto">
          <table class="w-full text-xs">
            <thead class="sticky top-0 bg-slate-700">
              <tr>
                <th class="px-2 py-2 text-left cursor-pointer select-none whitespace-nowrap"
                  :class="store.sortKey === 'root' ? 'text-cyan-300' : 'text-slate-300'"
                  @click="store.toggleSort('root')">词根{{ sortMark('root') }}</th>
                <th class="px-2 py-2 text-left cursor-pointer select-none whitespace-nowrap"
                  :class="store.sortKey === 'meaning' ? 'text-cyan-300' : 'text-slate-300'"
                  @click="store.toggleSort('meaning')">含义{{ sortMark('meaning') }}</th>
                <th v-for="(lang, i) in store.tableColumns" :key="lang"
                  class="px-2 py-2 text-left cursor-pointer select-none whitespace-nowrap"
                  :class="store.sortKey === lang ? 'text-cyan-300' : COL_PALETTE[i % COL_PALETTE.length].header"
                  @click="store.toggleSort(lang)">{{ lang }}{{ sortMark(lang) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cs in store.sortedCognates" :key="cs.root" class="border-t border-slate-700 hover:bg-slate-700">
                <td class="px-2 py-1.5 font-mono text-slate-200 font-bold">{{ cs.root }}</td>
                <td class="px-2 py-1.5 text-slate-400">{{ cs.meaning }}</td>
                <td v-for="(lang, i) in store.tableColumns" :key="lang" class="px-2 py-1.5 font-mono"
                  :class="COL_PALETTE[i % COL_PALETTE.length].cell">{{ cs.languages[lang] || '—' }}</td>
              </tr>
              <tr v-if="store.sortedCognates.length === 0">
                <td :colspan="store.tableColumns.length + 2" class="px-2 py-8 text-center text-slate-500 border-t border-slate-700">
                  <template v-if="isUncollectedFamily">「{{ selectedFamilyName }}」的词根数据尚未收录</template>
                  <template v-else>
                    当前筛选条件下暂未匹配到词根
                    <button v-if="store.hasActiveFilters" @click="store.clearFilters()" class="ml-2 text-cyan-400 hover:underline">清空筛选条件</button>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import * as d3 from 'd3'
import { useEtymologyStore, LANGUAGE_FAMILIES } from './store/etymology'

const store = useEtymologyStore()
const svgRef = ref<SVGSVGElement | null>(null)
const COLORS: Record<string, string> = { ie: '#3b82f6', st: '#22c55e', aa: '#f59e0b', ural: '#8b5cf6' }

// 词表语言列配色：顺序与原硬编码列一致，循环使用
const COL_PALETTE = [
  { header: 'text-cyan-400', cell: 'text-cyan-300' },
  { header: 'text-blue-400', cell: 'text-blue-300' },
  { header: 'text-green-400', cell: 'text-green-300' },
  { header: 'text-orange-400', cell: 'text-orange-300' },
  { header: 'text-purple-400', cell: 'text-purple-300' },
  { header: 'text-yellow-400', cell: 'text-yellow-300' },
]

const sortMark = (key: string) =>
  store.sortKey !== key ? '' : store.sortDir === 'asc' ? ' ▲' : ' ▼'

const selectedFamilyName = computed(() =>
  LANGUAGE_FAMILIES.find(f => f.id === store.selectedFamily)?.name ?? ''
)

// 未收录：该语系在数据集中没有任何词根；暂未匹配：有收录但被当前筛选条件排除
const isUncollectedFamily = computed(() =>
  store.selectedFamily !== 'all' && (store.familyCounts[store.selectedFamily]?.total ?? 0) === 0
)

function drawGraph() {
  if (!svgRef.value) return
  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()
  const W = svgRef.value.getBoundingClientRect().width || 700, H = 460
  const nodes = store.graph.nodes.map((n: any) => ({ ...n }))
  const links = store.graph.links.map((l: any) => ({ ...l }))
  const sim = d3.forceSimulation(nodes as any)
    .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(55))
    .force('charge', d3.forceManyBody().strength(-100))
    .force('center', d3.forceCenter(W / 2, H / 2))
    .force('collision', d3.forceCollide(22))
  const g = svg.append('g')
  svg.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.2, 3]).on('zoom', (e) => g.attr('transform', e.transform)) as any)
  const link = g.append('g').selectAll('line').data(links).join('line')
    .attr('stroke', '#475569').attr('stroke-width', 1).attr('opacity', 0.5)
  const node = g.append('g').selectAll('g').data(nodes).join('g')
    .call(d3.drag<any, any>()
      .on('start', (e, d: any) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
      .on('drag', (e, d: any) => { d.fx = e.x; d.fy = e.y })
      .on('end', (e, d: any) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null }))
    .on('click', (_: any, d: any) => { store.selectedNode = d })
  node.append('circle')
    .attr('r', (d: any) => d.language === 'Proto-IE' ? 12 : 7)
    .attr('fill', (d: any) => COLORS[d.family] || '#64748b')
    .attr('stroke', '#1e293b').attr('stroke-width', 1.5)
  node.append('text').attr('dy', -14).attr('text-anchor', 'middle').attr('font-size', 9).attr('fill', '#e2e8f0')
    .text((d: any) => d.word.length > 8 ? d.word.slice(0, 8) + '…' : d.word)
  node.append('title').text((d: any) => `${d.word} (${d.language}): ${d.meaning}`)
  sim.on('tick', () => {
    link.attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y)
    node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
  })
}

onMounted(() => { setTimeout(drawGraph, 100) })
</script>
