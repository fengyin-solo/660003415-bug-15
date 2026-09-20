<template>
  <div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-bold text-slate-400">语系概览</h3>
      <span class="text-xs text-slate-500">计数随搜索条件同步</span>
    </div>
    <div class="space-y-2">
      <button type="button"
        class="w-full text-left rounded-lg border px-3 py-2 transition-colors"
        :class="store.selectedFamily === 'all'
          ? 'border-cyan-500 bg-slate-700/60'
          : 'border-slate-700 hover:border-slate-500 hover:bg-slate-700/40'"
        @click="store.selectFamily('all')">
        <div class="flex items-center gap-2 text-sm">
          <span class="w-3 h-3 rounded-full flex-shrink-0 bg-slate-300"></span>
          <span class="font-bold flex-1">全部语系</span>
          <span class="text-xs text-cyan-300">{{ totalMatched }} / {{ totalAll }}</span>
        </div>
      </button>

      <button v-for="f in store.familyStats" :key="f.id" type="button"
        class="w-full text-left rounded-lg border px-3 py-2 transition-colors"
        :class="store.selectedFamily === f.id
          ? 'border-cyan-500 bg-slate-700/60'
          : 'border-slate-700 hover:border-slate-500 hover:bg-slate-700/40'"
        @click="store.selectFamily(f.id)">
        <div class="flex items-start gap-2 text-sm">
          <span class="w-3 h-3 rounded-full mt-0.5 flex-shrink-0" :style="{ backgroundColor: f.color }"></span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-bold">{{ f.name }}</span>
              <span class="text-[10px] text-slate-500">{{ f.era }}</span>
              <span class="ml-auto text-xs" :class="f.matched > 0 ? 'text-cyan-300' : 'text-slate-500'">
                {{ f.total === 0 ? '' : `${f.matched} / ${f.total}` }}
              </span>
            </div>

            <!-- 未收录：该语系在词库中完全没有词根 -->
            <span v-if="f.total === 0"
              class="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
              未收录
            </span>
            <!-- 暂未匹配：语系有收录，但当前搜索词下没有命中 -->
            <span v-else-if="f.matched === 0"
              class="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300">
              暂未匹配
            </span>

            <!-- 语言列表：同一筛选条件下逐语言的命中/收录数 -->
            <div v-else class="flex flex-wrap gap-1 mt-1">
              <span v-for="l in f.languages" :key="l.lang"
                class="inline-flex items-center gap-1 text-[10px] rounded px-1.5 py-0.5 border"
                :class="l.total === 0
                  ? 'border-slate-700 text-slate-600'
                  : l.matched === 0
                    ? 'border-slate-700 text-slate-500'
                    : 'border-slate-600 text-slate-300'">
                {{ l.lang }}
                <template v-if="l.total === 0">未收录</template>
                <template v-else :class="l.matched === 0 ? 'text-slate-500' : 'text-cyan-300'">
                  {{ l.matched }}/{{ l.total }}
                </template>
              </span>
            </div>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEtymologyStore, COGNATE_SETS } from '../store/etymology'

const store = useEtymologyStore()
const totalAll = COGNATE_SETS.length
const totalMatched = computed(() => store.searchMatched.length)
</script>
