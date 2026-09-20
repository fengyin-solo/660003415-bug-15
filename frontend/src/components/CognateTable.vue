<template>
  <div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-bold text-slate-400">同源词对照表</h3>
      <button type="button"
        class="text-xs text-cyan-400 hover:text-cyan-300"
        @click="store.setView('overview')">
        ← 返回概览
      </button>
    </div>

    <div class="flex flex-wrap gap-2 mb-2">
      <input v-model="store.searchQuery" placeholder="搜索词根/含义/词形..."
        class="flex-1 min-w-[180px] bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-500" />
      <select v-model="store.selectedFamily"
        class="bg-slate-900 border border-slate-600 rounded px-2 text-sm text-slate-300">
        <option value="all">全部语系</option>
        <option v-for="f in LANGUAGE_FAMILIES" :key="f.id" :value="f.id">{{ f.name }}</option>
      </select>
      <select v-model="store.sortKey"
        class="bg-slate-900 border border-slate-600 rounded px-2 text-sm text-slate-300">
        <option value="root">按词根排序</option>
        <option value="meaning">按含义排序</option>
      </select>
      <button type="button"
        class="bg-slate-900 border border-slate-600 rounded px-2.5 text-sm text-slate-300 hover:border-cyan-500"
        :title="store.sortAsc ? '升序' : '降序'"
        @click="store.sortAsc = !store.sortAsc">
        {{ store.sortAsc ? '↑ 升序' : '↓ 降序' }}
      </button>
      <button type="button"
        class="bg-slate-900 border border-slate-600 rounded px-2.5 text-sm text-slate-300 hover:border-cyan-500"
        @click="store.clearFilters">
        清空条件
      </button>
    </div>

    <!-- 计数行：直接取未排序的筛选结果，切换排序/方向时保持不变 -->
    <div class="text-xs text-slate-500 mb-2">
      「{{ store.scopeLabel }}」收录 {{ store.scopeTotal }} 条，当前匹配
      <span class="text-cyan-300 font-bold">{{ store.resultCount }}</span> 条
    </div>

    <div v-if="store.emptyReason === 'not-collected'"
      class="py-10 text-center text-sm text-slate-500">
      <div class="mb-1">「{{ store.scopeLabel }}」在词库中<span class="text-slate-400">未收录</span>词根</div>
      <button type="button" class="text-xs text-cyan-400 hover:text-cyan-300"
        @click="store.clearFilters">清空筛选条件</button>
    </div>
    <div v-else-if="store.emptyReason === 'no-match'"
      class="py-10 text-center text-sm text-slate-500">
      <div class="mb-1">「{{ store.scopeLabel }}」已收录 {{ store.scopeTotal }} 条，但与当前搜索词
        <span class="text-amber-300">暂未匹配</span>
      </div>
      <button type="button" class="text-xs text-cyan-400 hover:text-cyan-300"
        @click="store.searchQuery = ''">清除搜索词</button>
    </div>

    <div v-else class="overflow-x-auto max-h-[420px] overflow-y-auto">
      <table class="w-full text-xs">
        <thead class="sticky top-0 bg-slate-700">
          <tr>
            <th class="px-2 py-2 text-left text-slate-300">
              词根
              <span v-if="store.sortKey === 'root'" class="text-cyan-400">{{ store.sortAsc ? '↑' : '↓' }}</span>
            </th>
            <th class="px-2 py-2 text-left text-slate-300">
              含义
              <span v-if="store.sortKey === 'meaning'" class="text-cyan-400">{{ store.sortAsc ? '↑' : '↓' }}</span>
            </th>
            <th class="px-2 py-2 text-left text-cyan-400">英语</th>
            <th class="px-2 py-2 text-left text-blue-400">法语</th>
            <th class="px-2 py-2 text-left text-green-400">德语</th>
            <th class="px-2 py-2 text-left text-orange-400">西班牙语</th>
            <th class="px-2 py-2 text-left text-purple-400">俄语</th>
            <th class="px-2 py-2 text-left text-yellow-400">拉丁语</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cs in store.sortedCognates" :key="cs.root"
            class="border-t border-slate-700 hover:bg-slate-700">
            <td class="px-2 py-1.5 font-mono text-slate-200 font-bold">{{ cs.root }}</td>
            <td class="px-2 py-1.5 text-slate-400">{{ cs.meaning }}</td>
            <td class="px-2 py-1.5 font-mono text-cyan-300">{{ cs.languages['英语'] || '—' }}</td>
            <td class="px-2 py-1.5 font-mono text-blue-300">{{ cs.languages['法语'] || '—' }}</td>
            <td class="px-2 py-1.5 font-mono text-green-300">{{ cs.languages['德语'] || '—' }}</td>
            <td class="px-2 py-1.5 font-mono text-orange-300">{{ cs.languages['西班牙语'] || '—' }}</td>
            <td class="px-2 py-1.5 font-mono text-purple-300">{{ cs.languages['俄语'] || '—' }}</td>
            <td class="px-2 py-1.5 font-mono text-yellow-300">{{ cs.languages['拉丁语'] || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEtymologyStore, LANGUAGE_FAMILIES } from '../store/etymology'

const store = useEtymologyStore()
</script>
