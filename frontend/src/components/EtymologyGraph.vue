<template>
  <svg ref="svgRef" class="w-full bg-slate-900 rounded" style="height:460px"></svg>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as d3 from 'd3'
import { useEtymologyStore, LANGUAGE_FAMILIES } from '../store/etymology'

const store = useEtymologyStore()
const svgRef = ref<SVGSVGElement | null>(null)

// 图例颜色的唯一来源：与 LANGUAGE_FAMILIES 保持一致，不再另写一份硬编码色值
const COLORS: Record<string, string> = Object.fromEntries(
  LANGUAGE_FAMILIES.map(f => [f.id, f.color])
)

// 筛选条件为空（全部语系 + 无搜索词）时不淡化任何节点
function isUnfiltered(ids: Set<string>): boolean {
  return ids.size === store.graph.nodes.filter((n: any) => n.language === 'Proto-IE').length
}

function applyHighlight() {
  if (!svgRef.value) return
  const ids = store.activeRootIds
  const unfiltered = isUnfiltered(ids)
  d3.select(svgRef.value).selectAll<SVGLineElement, any>('line')
    .attr('opacity', (d: any) => {
      const root = d.source.id ?? d.source
      return unfiltered || ids.has(root) ? 0.5 : 0.08
    })
  d3.select(svgRef.value).selectAll<SVGGElement, any>('g.node-g')
    .attr('opacity', (d: any) => (unfiltered || ids.has(d.rootId) ? 1 : 0.15))
}

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
    .attr('stroke', '#475569').attr('stroke-width', 1)
  const node = g.append('g').selectAll('g').data(nodes).join('g').attr('class', 'node-g')
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
  // 数据尚未加载完时 tick 未必应用过高亮，首帧后同步一次
  applyHighlight()
}

onMounted(() => { setTimeout(drawGraph, 100) })
// 同一筛选条件变化时只更新明暗，不重排布局；重绘后（视图切回）重新应用
watch(() => store.activeRootIds, applyHighlight, { deep: false })
</script>
