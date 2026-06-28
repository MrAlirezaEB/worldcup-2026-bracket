<template>
  <div class="ko-scroll">
    <div class="ko-bracket">
      <div
        v-for="(round, ri) in rounds"
        :key="round.key"
        class="ko-round"
        :class="{ 'ko-round--last': false, 'ko-round--single': round.matches.length === 1 }"
      >
        <div class="ko-round-title">{{ round.name }}</div>
        <div
          v-for="(match, i) in round.matches"
          :key="round.key + '-' + i"
          class="ko-cell"
          :class="{ 'ko-cell--odd': i % 2 === 0 }"
        >
          <div class="ko-match">
            <div class="ko-team">
              <img v-if="teamFlags[match.teamA]" :src="`https://flagcdn.com/w40/${teamFlags[match.teamA]}.png`" :alt="match.teamA" class="ko-flag" />
              <span class="ko-flag ko-flag--empty" v-else></span>
              <span class="ko-name" :class="{ 'ko-win': winner(match) === match.teamA }">{{ match.teamA || 'TBD' }}</span>
              <input
                v-if="editable"
                type="number"
                min="0"
                v-model="match.score.a"
                :disabled="!match.teamA || !match.teamB"
                class="ko-input"
              />
              <span v-else class="ko-score">{{ displayScore(match.scoreA) }}</span>
            </div>
            <div class="ko-team">
              <img v-if="teamFlags[match.teamB]" :src="`https://flagcdn.com/w40/${teamFlags[match.teamB]}.png`" :alt="match.teamB" class="ko-flag" />
              <span class="ko-flag ko-flag--empty" v-else></span>
              <span class="ko-name" :class="{ 'ko-win': winner(match) === match.teamB }">{{ match.teamB || 'TBD' }}</span>
              <input
                v-if="editable"
                type="number"
                min="0"
                v-model="match.score.b"
                :disabled="!match.teamA || !match.teamB"
                class="ko-input"
              />
              <span v-else class="ko-score">{{ displayScore(match.scoreB) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Champion column -->
      <div class="ko-round ko-round--last">
        <div class="ko-round-title">Champion</div>
        <div class="ko-cell">
          <div class="ko-champion">
            <img v-if="champion && teamFlags[champion]" :src="`https://flagcdn.com/w40/${teamFlags[champion]}.png`" :alt="champion" class="ko-flag" />
            <span>🏆 {{ champion || '—' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  rounds: { type: Array, default: () => [] },
  champion: { type: String, default: null },
  teamFlags: { type: Object, default: () => ({}) },
  editable: { type: Boolean, default: false }
})

const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v))

const winner = (m) => {
  let a, b
  if (m.score) {
    a = num(m.score.a); b = num(m.score.b)
  } else {
    a = num(m.scoreA); b = num(m.scoreB)
  }
  if (a === null || b === null || Number.isNaN(a) || Number.isNaN(b) || a === b) return null
  return a > b ? m.teamA : m.teamB
}

const displayScore = (v) => (v === null || v === undefined || v === '' ? '–' : v)
</script>

<style scoped>
.ko-scroll {
  overflow-x: auto;
  padding-bottom: 1rem;
}
.ko-bracket {
  display: flex;
  align-items: stretch;
  min-width: max-content;
  padding: 0.5rem 0;
}
.ko-round {
  display: flex;
  flex-direction: column;
  flex: 1 0 auto;
  min-width: 210px;
  margin-right: 2.5rem;
}
.ko-round--last {
  margin-right: 0;
  min-width: 180px;
  justify-content: center;
}
.ko-round-title {
  text-align: center;
  font-weight: 800;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #eab308;
  margin-bottom: 0.75rem;
}
.ko-cell {
  flex: 1 0 auto;
  display: flex;
  align-items: center;
  position: relative;
}
.ko-match {
  width: 100%;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  margin-bottom: 10px;
  margin-top: 10px;
}
.ko-team {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
}
.ko-team + .ko-team {
  border-top: 1px solid #334155;
}
.ko-flag {
  width: 22px;
  height: 14px;
  object-fit: cover;
  border-radius: 2px;
  flex: 0 0 auto;
  box-shadow: 0 0 1px rgba(0, 0, 0, 0.6);
}
.ko-flag--empty {
  background: #334155;
  border-radius: 2px;
}
.ko-name {
  font-size: 13px;
  color: #e2e8f0;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ko-name.ko-win {
  color: #4ade80;
  font-weight: 700;
}
.ko-input {
  width: 38px;
  padding: 2px;
  text-align: center;
  border-radius: 4px;
  background: #0f172a;
  border: 1px solid #475569;
  color: #fff;
  font-size: 13px;
}
.ko-input:disabled {
  opacity: 0.4;
}
.ko-score {
  width: 24px;
  text-align: center;
  font-weight: 700;
  color: #fff;
  font-size: 13px;
}
.ko-champion {
  background: linear-gradient(135deg, #eab308, #d97706);
  color: #0f172a;
  font-weight: 900;
  border-radius: 10px;
  padding: 12px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* --- Tree connectors --- */
/* horizontal line leaving each match (all rounds except the champion column) */
.ko-round:not(.ko-round--last) .ko-cell::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 100%;
  width: 2.5rem;
  height: 2px;
  background: #475569;
}
/* vertical line joining each pair, drawn from the first match of the pair */
.ko-round:not(.ko-round--last):not(.ko-round--single) .ko-cell--odd::before {
  content: '';
  position: absolute;
  top: 50%;
  left: calc(100% + 2.5rem);
  width: 2px;
  height: 100%;
  background: #475569;
}
</style>
