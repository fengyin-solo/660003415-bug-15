<template>
  <div class="min-h-screen bg-slate-900 text-slate-200">
    <header class="border-b border-slate-700 px-6 py-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-cyan-400">语言词源图谱与多语系演化追踪</h1>
          <p class="text-sm text-slate-500 mt-1">D3.js力导向图 · 印欧语系演化 · 同源词对照 · 500+词根</p>
        </div>
        <nav class="flex rounded-lg border border-slate-700 overflow-hidden text-sm flex-shrink-0">
          <button type="button"
            class="px-4 py-1.5"
            :class="store.view === 'overview' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
            @click="store.setView('overview')">概览</button>
          <button type="button"
            class="px-4 py-1.5"
            :class="store.view === 'wordlist' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
            @click="store.setView('wordlist')">词表</button>
        </nav>
      </div>
    </header>

    <div class="p-4 space-y-4">
      <template v-if="store.view === 'overview'">
        <div class="grid lg:grid-cols-3 gap-4">
          <div class="lg:col-span-2 bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-bold text-slate-400">词源力导向网络</h3>
              <div class="flex gap-3 text-xs">
                <span v-for="f in LANGUAGE_FAMILIES" :key="f.id" class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: f.color }"></span>{{ f.name }}
                </span>
              </div>
            </div>
            <EtymologyGraph />
            <p v-if="store.selectedFamily !== 'all' || store.searchQuery" class="text-xs text-slate-500 mt-2">
              当前筛选：{{ store.scopeLabel }} · 匹配 {{ store.resultCount }}/{{ store.scopeTotal }}，高亮节点与词表一致
              <button type="button" class="text-cyan-400 hover:text-cyan-300 ml-2"
                @click="store.setView('wordlist')">查看词表 →</button>
            </p>
          </div>
          <div class="space-y-4">
            <FamilyOverview />
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
      </template>

      <template v-else>
        <CognateTable />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEtymologyStore, LANGUAGE_FAMILIES } from './store/etymology'
import EtymologyGraph from './components/EtymologyGraph.vue'
import FamilyOverview from './components/FamilyOverview.vue'
import CognateTable from './components/CognateTable.vue'

const store = useEtymologyStore()
</script>
