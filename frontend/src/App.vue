<template>
  <div class="min-h-screen bg-slate-900 text-white font-sans pb-10">
    <!-- Header -->
    <header class="bg-gradient-to-r from-blue-800 to-indigo-900 py-8 shadow-2xl mb-8 border-b-4 border-yellow-500">
      <h1 class="text-4xl md:text-6xl font-black text-center uppercase tracking-tighter italic">
        <span class="text-yellow-500">BUGLOOS</span> WorldCup 2026 Bracket
      </h1>
      <p class="text-center text-blue-200 mt-2 font-medium">Predict the Group Stage Standings</p>
    </header>

    <main class="container mx-auto px-4">
      <!-- Login Section -->
      <div v-if="!isLoggedIn" class="max-w-4xl mx-auto">
        <div class="max-w-md mx-auto bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 mt-10">
          <h2 class="text-2xl font-bold mb-6 text-center">Enter your email to start</h2>
          <form @submit.prevent="checkEmail">
            <div class="mb-4">
              <input 
                v-model="email" 
                type="email" 
                required 
                placeholder="your@email.com" 
                class="w-full p-4 rounded-lg bg-slate-700 border border-slate-600 focus:border-yellow-500 focus:outline-none transition-colors text-white"
              />
            </div>
            <button 
              type="submit" 
              :disabled="loading"
              class="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-4 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50"
            >
              {{ loading ? 'Checking...' : 'Enter Arena' }}
            </button>
            <p v-if="error" class="text-red-400 mt-4 text-center text-sm font-medium">{{ error }}</p>
          </form>
        </div>

        <!-- Scoreboard -->
        <div v-if="scoreboard.length > 0" class="mt-16 bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
          <div class="bg-gradient-to-r from-yellow-500 to-amber-600 px-8 py-4">
            <h2 class="text-2xl font-black text-slate-900 uppercase italic flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Global Scoreboard
            </h2>
          </div>
          <div class="p-4">
            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead>
                  <tr class="text-slate-500 uppercase text-xs tracking-widest border-b border-slate-700">
                    <th class="px-6 py-4">Rank</th>
                    <th class="px-6 py-4">Player</th>
                    <th class="px-6 py-4 text-right hidden sm:table-cell">Group</th>
                    <th class="px-6 py-4 text-right hidden sm:table-cell">KO</th>
                    <th class="px-6 py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-700/50">
                  <tr v-for="(entry, index) in scoreboard" :key="entry.email" class="hover:bg-slate-700/30 transition-colors group">
                    <td class="px-6 py-4">
                      <span :class="[
                        'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                        index === 0 ? 'bg-yellow-500 text-slate-900' : 
                        index === 1 ? 'bg-slate-300 text-slate-900' :
                        index === 2 ? 'bg-amber-700 text-white' : 'bg-slate-700 text-slate-400'
                      ]">
                        {{ index + 1 }}
                      </span>
                    </td>
                    <td class="px-6 py-4 font-medium">{{ entry.email }}</td>
                    <td class="px-6 py-4 text-right text-slate-400 hidden sm:table-cell">{{ entry.groupScore ?? 0 }}</td>
                    <td class="px-6 py-4 text-right text-indigo-400 hidden sm:table-cell">{{ entry.knockoutScore ?? 0 }}</td>
                    <td class="px-6 py-4 text-right">
                      <span class="text-xl font-black text-yellow-500 group-hover:scale-110 inline-block transition-transform">
                        {{ entry.score }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Admin Section -->
      <div v-else-if="isAdmin" class="space-y-8">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl gap-4">
          <div>
            <h2 class="text-2xl font-bold text-red-500">Admin Panel</h2>
            <p class="text-slate-400">Set official tournament results and manage system</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center bg-slate-700 px-4 py-2 rounded-lg border border-slate-600">
              <span class="mr-3 font-medium text-sm">Group stage:</span>
              <button
                @click="toggleSubmissions"
                :class="['relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none', submissionsEnabled ? 'bg-green-600' : 'bg-slate-500']"
              >
                <span :class="['inline-block h-4 w-4 transform rounded-full bg-white transition-transform', submissionsEnabled ? 'translate-x-6' : 'translate-x-1']" />
              </button>
              <span :class="['ml-2 text-xs font-bold uppercase', submissionsEnabled ? 'text-green-400' : 'text-slate-400']">
                {{ submissionsEnabled ? 'Open' : 'Closed' }}
              </span>
            </div>
            <div class="flex items-center bg-slate-700 px-4 py-2 rounded-lg border border-slate-600">
              <span class="mr-3 font-medium text-sm">Knockout:</span>
              <button
                @click="toggleKnockout"
                :class="['relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none', knockoutEnabled ? 'bg-green-600' : 'bg-slate-500']"
              >
                <span :class="['inline-block h-4 w-4 transform rounded-full bg-white transition-transform', knockoutEnabled ? 'translate-x-6' : 'translate-x-1']" />
              </button>
              <span :class="['ml-2 text-xs font-bold uppercase', knockoutEnabled ? 'text-green-400' : 'text-slate-400']">
                {{ knockoutEnabled ? 'Open' : 'Closed' }}
              </span>
            </div>
            <button @click="logout" class="bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-lg transition-colors border border-slate-600">
              Exit Admin
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div v-for="group in adminResults" :key="group.groupName" class="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg">
            <div class="bg-slate-700 px-4 py-2 font-bold text-yellow-500 border-b border-slate-600 flex justify-between items-center">
              <span>Group {{ group.groupName }}</span>
            </div>
            
            <draggable 
              v-model="group.teams" 
              item-key="id"
              class="p-4 space-y-2"
              ghost-class="opacity-50"
            >
              <template #item="{ element, index }">
                <div class="flex items-center bg-slate-700/50 p-3 rounded-lg cursor-move hover:bg-slate-600 transition-colors">
                  <span class="w-6 h-6 flex items-center justify-center bg-slate-800 rounded-full text-xs font-bold mr-3 text-slate-400">
                    {{ index + 1 }}
                  </span>
                  <img 
                    v-if="teamFlags[element]" 
                    :src="`https://flagcdn.com/w40/${teamFlags[element]}.png`" 
                    :alt="element"
                    class="w-6 h-4 object-cover rounded-sm mr-3 shadow-sm"
                  />
                  <span class="font-medium text-slate-200">{{ element }}</span>
                </div>
              </template>
            </draggable>
          </div>
        </div>

        <div class="mt-12 flex flex-col items-center">
          <button
            @click="saveAdminResults"
            :disabled="submitting"
            class="bg-red-600 hover:bg-red-700 text-white font-black py-5 px-12 rounded-full text-xl shadow-2xl transition-all transform hover:scale-110 uppercase tracking-widest"
          >
            {{ submitting ? 'Saving...' : 'Save Official Results' }}
          </button>
        </div>

        <!-- Admin: Knockout Bracket Setup -->
        <div class="border-t-2 border-slate-700 pt-8 space-y-6">
          <div>
            <h3 class="text-2xl font-bold text-indigo-400">Knockout Bracket — Round of 32</h3>
            <p class="text-slate-400 text-sm">Define the 16 Round-of-32 matchups. These seed the whole knockout bracket for every player.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div v-for="(match, i) in adminBracket" :key="'kb' + i" class="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-2">
              <div class="text-xs font-bold text-slate-500 uppercase tracking-widest">Match {{ i + 1 }}</div>
              <div class="flex items-center gap-2">
                <img v-if="teamFlags[match.teamA]" :src="`https://flagcdn.com/w40/${teamFlags[match.teamA]}.png`" :alt="match.teamA" class="w-6 h-4 object-cover rounded-sm flex-shrink-0" />
                <span v-else class="w-6 h-4 bg-slate-600 rounded-sm flex-shrink-0"></span>
                <select v-model="match.teamA" class="w-full p-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:border-indigo-500 focus:outline-none">
                  <option value="">— Team A —</option>
                  <option v-for="t in allTeams" :key="'a' + i + t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div class="text-center text-[10px] text-slate-500 uppercase">vs</div>
              <div class="flex items-center gap-2">
                <img v-if="teamFlags[match.teamB]" :src="`https://flagcdn.com/w40/${teamFlags[match.teamB]}.png`" :alt="match.teamB" class="w-6 h-4 object-cover rounded-sm flex-shrink-0" />
                <span v-else class="w-6 h-4 bg-slate-600 rounded-sm flex-shrink-0"></span>
                <select v-model="match.teamB" class="w-full p-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:border-indigo-500 focus:outline-none">
                  <option value="">— Team B —</option>
                  <option v-for="t in allTeams" :key="'b' + i + t" :value="t">{{ t }}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="flex justify-center">
            <button
              @click="saveAdminBracket"
              :disabled="adminKoSaving"
              class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-10 rounded-full shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 uppercase tracking-widest"
            >
              {{ adminKoSaving ? 'Saving...' : 'Save Bracket' }}
            </button>
          </div>
        </div>

        <!-- Admin: Official Knockout Results -->
        <div v-if="bracketReady" class="border-t-2 border-slate-700 pt-8 space-y-6">
          <div>
            <h3 class="text-2xl font-bold text-red-400">Official Knockout Results</h3>
            <p class="text-slate-400 text-sm">Enter the real score of each match as it is played. Winners advance automatically. Leave future matches blank.</p>
          </div>

          <KnockoutBracket :rounds="adminKoRounds" :champion="adminKoChampion" :team-flags="teamFlags" editable />

          <div class="flex justify-center">
            <button
              @click="saveAdminKnockoutResults"
              :disabled="adminKoSaving"
              class="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-10 rounded-full shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 uppercase tracking-widest"
            >
              {{ adminKoSaving ? 'Saving...' : 'Save Knockout Results' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Knockout Prediction Builder -->
      <div v-else-if="isLoggedIn && hasSubmitted && koPredicting" class="space-y-8">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl gap-4">
          <div>
            <h2 class="text-2xl font-bold text-indigo-400">Knockout Predictions</h2>
            <p class="text-slate-400 text-sm">Set the score of every match — the winner advances automatically. Exact score = 10 pts, correct winner = 3 pts. No draws.</p>
          </div>
          <button @click="cancelKnockout" class="text-slate-400 hover:text-white text-sm underline">Back to dashboard</button>
        </div>

        <KnockoutBracket :rounds="koRounds" :champion="koChampion" :team-flags="teamFlags" editable />

        <div class="flex flex-col items-center">
          <button
            @click="submitKnockout"
            :disabled="koSubmitting || !koChampion"
            class="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-black py-5 px-12 rounded-full text-xl shadow-2xl transition-all transform hover:scale-110 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 uppercase tracking-widest"
          >
            {{ koSubmitting ? 'Submitting...' : 'Submit Knockout Prediction' }}
          </button>
          <p v-if="koSubmitError" class="text-red-400 mt-4 font-bold bg-red-900/20 px-4 py-2 rounded-lg">{{ koSubmitError }}</p>
          <p v-else-if="!koChampion" class="text-slate-500 mt-4 text-sm">Fill in every match (no draws) to decide a champion and unlock submit.</p>
        </div>
      </div>

      <!-- Bracket Section -->
      <div v-else-if="isLoggedIn && !hasSubmitted">
        <div class="flex justify-between items-center mb-8 bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p class="text-lg">Welcome, <span class="text-yellow-500 font-bold">{{ email }}</span></p>
          <button @click="logout" class="text-slate-400 hover:text-white text-sm underline">Change Email</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div v-for="group in groups" :key="group.groupName" class="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg">
            <div class="bg-slate-700 px-4 py-2 font-bold text-yellow-500 border-b border-slate-600 flex justify-between items-center">
              <span>Group {{ group.groupName }}</span>
              <span class="text-[10px] text-slate-400 uppercase tracking-widest">Drag to reorder</span>
            </div>
            
            <draggable 
              v-model="group.teams" 
              item-key="id"
              class="p-4 space-y-2"
              ghost-class="opacity-50"
              drag-class="scale-105"
            >
              <template #item="{ element, index }">
                <div class="flex items-center bg-slate-700/50 p-3 rounded-lg cursor-move hover:bg-slate-600 transition-colors border border-transparent hover:border-yellow-500/30 group">
                  <span class="w-6 h-6 flex items-center justify-center bg-slate-800 rounded-full text-xs font-bold mr-3 text-slate-400 group-hover:text-yellow-500">
                    {{ index + 1 }}
                  </span>
                  <img 
                    v-if="teamFlags[element]" 
                    :src="`https://flagcdn.com/w40/${teamFlags[element]}.png`" 
                    :alt="element"
                    class="w-6 h-4 object-cover rounded-sm mr-3 shadow-sm"
                  />
                  <span class="font-medium text-slate-200">{{ element }}</span>
                  <div class="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
        </div>

        <div class="mt-12 flex flex-col items-center">
          <div v-if="!submissionsEnabled" class="mb-6 bg-red-900/40 border border-red-500 text-red-200 px-6 py-4 rounded-xl text-center max-w-md">
            <p class="font-bold text-lg">⚠️ Submissions are currently closed.</p>
            <p class="text-sm opacity-80">The admin has disabled new entries. You can still view your previous results if you already submitted.</p>
          </div>
          <button 
            @click="showConfirm = true" 
            :disabled="submitting || !submissionsEnabled"
            class="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black py-5 px-12 rounded-full text-xl shadow-2xl transition-all transform hover:scale-110 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 uppercase tracking-widest"
          >
            {{ submitting ? 'Submitting...' : 'Submit Prediction' }}
          </button>
          <p v-if="submitError" class="text-red-400 mt-4 font-bold bg-red-900/20 px-4 py-2 rounded-lg">{{ submitError }}</p>
        </div>
      </div>

      <!-- Results Section -->
      <div v-else-if="isLoggedIn && hasSubmitted" class="space-y-12">
        <div class="flex justify-between items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <div>
            <h2 class="text-2xl font-bold text-yellow-500">Tournament Dashboard</h2>
            <div class="flex flex-wrap items-center gap-2 mt-1">
              <p class="text-slate-400">View your prediction and community results</p>
              <span class="bg-slate-700 text-slate-200 px-3 py-1 rounded-full text-xs font-bold">
                Group: {{ mySubmission?.groupScore || 0 }}
              </span>
              <span class="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                Knockout: {{ mySubmission?.knockoutScore || 0 }}
              </span>
              <span class="bg-yellow-500 text-slate-900 px-3 py-1 rounded-full text-sm font-black">
                TOTAL: {{ mySubmission?.score || 0 }}
              </span>
            </div>
          </div>
          <button @click="logout" class="bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-lg transition-colors border border-slate-600">
            Sign Out
          </button>
        </div>

        <!-- Knockout panel -->
        <div class="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
          <div class="bg-gradient-to-r from-indigo-700 to-blue-800 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <h3 class="text-xl font-black uppercase italic tracking-tight">Knockout Stage</h3>
            <span v-if="hasSubmittedKnockout" class="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm font-black">
              KNOCKOUT SCORE: {{ mySubmission?.knockoutScore || 0 }}
            </span>
          </div>
          <div class="p-6">
            <!-- Not yet submitted -->
            <div v-if="!hasSubmittedKnockout">
              <div v-if="!knockoutEnabled" class="text-slate-400">
                ⏳ Knockout predictions are not open yet. Check back once the admin opens them.
              </div>
              <div v-else-if="!bracketReady" class="text-slate-400">
                ⏳ Knockout predictions are open, but the bracket has not been published yet.
              </div>
              <div v-else class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <p class="text-slate-300">The knockout bracket is live! Predict the score of every match down to the champion. Exact score = <span class="text-yellow-500 font-bold">10 pts</span>, correct winner = <span class="text-yellow-500 font-bold">3 pts</span>.</p>
                <button
                  @click="startKnockout"
                  class="flex-shrink-0 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-black py-3 px-8 rounded-full shadow-xl transition-all transform hover:scale-105 uppercase tracking-widest"
                >
                  Predict Knockout
                </button>
              </div>
            </div>

            <!-- Already submitted: read-only -->
            <div v-else class="space-y-4">
              <div class="flex flex-wrap items-center gap-3">
                <span class="text-slate-400 text-sm">Your predicted champion:</span>
                <span class="bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-900 font-black px-4 py-1 rounded-full">
                  🏆 {{ myKnockoutChampion || '—' }}
                </span>
              </div>
              <KnockoutBracket :rounds="myKnockoutRounds" :champion="myKnockoutChampion" :team-flags="teamFlags" />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <!-- Sidebar: Community Submissions -->
          <div class="lg:col-span-1 space-y-4">
            <h3 class="text-xl font-bold flex items-center">
              <span class="w-2 h-8 bg-yellow-500 mr-3 rounded-full"></span>
              Community ({{ allSubmissions.length }})
            </h3>
            <div class="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden max-h-[600px] overflow-y-auto">
              <div 
                v-for="sub in allSubmissions" 
                :key="sub.email"
                @click="currentUserSubmission = sub"
                :class="['p-4 cursor-pointer transition-colors border-b border-slate-700 last:border-0 hover:bg-slate-700/50', currentUserSubmission?.email === sub.email ? 'bg-blue-900/30 border-l-4 border-l-blue-500' : '']"
              >
                <p class="font-medium truncate" :class="sub.email === email ? 'text-yellow-500' : 'text-slate-200'">
                  {{ sub.email === email ? 'Your Prediction' : sub.email }}
                </p>
                <div class="flex justify-between items-center mt-1">
                  <p class="text-[10px] text-slate-500 uppercase">{{ new Date(sub.createdAt).toLocaleDateString() }}</p>
                  <p class="text-xs font-bold text-yellow-500/80">{{ sub.score }} pts</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Main Content: Bracket View -->
          <div class="lg:col-span-3 space-y-6">
            <h3 class="text-xl font-bold flex items-center">
              <span class="w-2 h-8 bg-blue-500 mr-3 rounded-full"></span>
              {{ currentUserSubmission?.email === email ? 'Your Final' : (currentUserSubmission?.email + "'s") }} Bracket
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div v-for="group in currentUserSubmission?.standings" :key="group.groupName" class="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg">
                <div class="bg-slate-700 px-4 py-2 font-bold text-yellow-500 border-b border-slate-600">
                  Group {{ group.groupName }}
                </div>
                <div class="p-3 space-y-1">
                  <div v-for="(team, idx) in group.teams" :key="team" class="flex items-center bg-slate-700/30 p-2 rounded-lg">
                    <span class="w-5 h-5 flex items-center justify-center bg-slate-800 rounded-full text-[10px] font-bold mr-3 text-slate-500">
                      {{ idx + 1 }}
                    </span>
                    <img 
                      v-if="teamFlags[team]" 
                      :src="`https://flagcdn.com/w40/${teamFlags[team]}.png`" 
                      :alt="team"
                      class="w-5 h-3 object-cover rounded-sm mr-2 opacity-80"
                    />
                    <span class="text-sm font-medium text-slate-300">{{ team }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Success Modal -->
    <div v-if="showSuccess" class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div class="bg-slate-800 p-8 rounded-3xl max-w-sm w-full text-center border-2 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
        <div class="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-3xl font-black mb-2 text-green-500 uppercase italic">SUCCESS!</h2>
        <p class="text-slate-300 mb-8">Your prediction has been recorded. Good luck!</p>
        <button @click="showSuccess = false" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors">
          View Dashboard
        </button>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirm" class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div class="bg-slate-800 p-8 rounded-3xl max-w-md w-full text-center border-2 border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.2)]">
        <div class="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 class="text-3xl font-black mb-2 uppercase italic text-yellow-500">Wait a second!</h2>
        <p class="text-slate-300 mb-8 text-lg">
          This submission is <span class="text-white font-bold underline text-xl">FINAL</span>. 
          Are you sure you want to lock in these predictions? You won't be able to edit them later.
        </p>
        <div class="grid grid-cols-2 gap-4">
          <button 
            @click="showConfirm = false" 
            class="bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl transition-colors"
          >
            Go Back
          </button>
          <button 
            @click="submitPrediction" 
            :disabled="submitting"
            class="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-black py-4 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50"
          >
            {{ submitting ? 'Submitting...' : 'Yes, Lock It!' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

onMounted(() => {
  fetchScoreboard()
  fetchSettings()
  fetchKnockoutBracket()
})
import draggable from 'vuedraggable'
import axios from 'axios'
import KnockoutBracket from './KnockoutBracket.vue'

const API_BASE = '/api'

const email = ref('')
const isLoggedIn = ref(false)
const isAdmin = ref(false)
const hasSubmitted = ref(false)
const allSubmissions = ref([])
const scoreboard = ref([])
const currentUserSubmission = ref(null)
const loading = ref(false)
const error = ref('')
const submitting = ref(false)
const submitError = ref('')
const showSuccess = ref(false)
const showConfirm = ref(false)
const adminResults = ref([])
const submissionsEnabled = ref(true)

// --- Knockout stage ---
const ROUND_DEFS = [
  { key: 'R32', name: 'Round of 32', count: 16 },
  { key: 'R16', name: 'Round of 16', count: 8 },
  { key: 'QF', name: 'Quarter-finals', count: 4 },
  { key: 'SF', name: 'Semi-finals', count: 2 },
  { key: 'F', name: 'Final', count: 1 },
]

function emptyScores() {
  const s = {}
  ROUND_DEFS.forEach(r => { s[r.key] = Array.from({ length: r.count }, () => ({ a: '', b: '' })) })
  return s
}

function winnerOf(teamA, teamB, score) {
  if (!teamA || !teamB || !score) return null
  if (score.a === '' || score.b === '' || score.a === null || score.b === null) return null
  const a = Number(score.a), b = Number(score.b)
  if (Number.isNaN(a) || Number.isNaN(b) || a === b) return null
  return a > b ? teamA : teamB
}

// Build all knockout rounds from the fixed R32 matchups + a set of score inputs.
// Each round's teams are derived from the predicted winners of the previous round.
function buildRounds(r32, scores) {
  const rounds = []
  let pairs = (r32 || []).map(m => [m.teamA, m.teamB])
  for (const def of ROUND_DEFS) {
    const sc = scores[def.key] || []
    const matches = pairs.map((pair, i) => ({ teamA: pair[0], teamB: pair[1], score: sc[i] || { a: '', b: '' } }))
    rounds.push({ key: def.key, name: def.name, matches })
    const winners = matches.map(m => winnerOf(m.teamA, m.teamB, m.score))
    pairs = []
    for (let i = 0; i < winners.length; i += 2) pairs.push([winners[i], winners[i + 1]])
  }
  return rounds
}

function championOf(rounds) {
  if (!rounds.length) return null
  const f = rounds[rounds.length - 1].matches[0]
  return winnerOf(f.teamA, f.teamB, f.score)
}

function roundsToPayload(rounds) {
  const payload = {}
  rounds.forEach(r => {
    payload[r.key] = r.matches.map(m => ({
      teamA: m.teamA || null,
      teamB: m.teamB || null,
      scoreA: (m.score.a === '' || m.score.a === null) ? null : Number(m.score.a),
      scoreB: (m.score.b === '' || m.score.b === null) ? null : Number(m.score.b)
    }))
  })
  return payload
}

function payloadToScores(payload) {
  const s = emptyScores()
  ROUND_DEFS.forEach(r => {
    const arr = (payload && payload[r.key]) || []
    s[r.key] = Array.from({ length: r.count }, (_, i) => ({
      a: arr[i] && arr[i].scoreA != null ? String(arr[i].scoreA) : '',
      b: arr[i] && arr[i].scoreB != null ? String(arr[i].scoreB) : ''
    }))
  })
  return s
}

const knockoutEnabled = ref(false)
const knockoutBracket = ref(null)            // { r32: [{ teamA, teamB }, ...16] }
const koScores = ref(emptyScores())          // logged-in user's predictions
const koPredicting = ref(false)
const koSubmitting = ref(false)
const koSubmitError = ref('')
const mySubmission = ref(null)               // the logged-in user's own submission

// Admin knockout state
const adminBracket = ref(Array.from({ length: 16 }, () => ({ teamA: '', teamB: '' })))
const adminKoScores = ref(emptyScores())
const adminKoSaving = ref(false)

const allTeams = computed(() => {
  const set = new Set()
  groups.value.forEach(g => g.teams.forEach(t => set.add(t)))
  return Array.from(set).sort()
})
const koRounds = computed(() => knockoutBracket.value ? buildRounds(knockoutBracket.value.r32, koScores.value) : [])
const koChampion = computed(() => championOf(koRounds.value))
const adminKoRounds = computed(() => knockoutBracket.value ? buildRounds(knockoutBracket.value.r32, adminKoScores.value) : [])
const adminKoChampion = computed(() => championOf(adminKoRounds.value))
const hasSubmittedKnockout = computed(() => !!(mySubmission.value && mySubmission.value.knockout))
const bracketReady = computed(() => !!(knockoutBracket.value && Array.isArray(knockoutBracket.value.r32) && knockoutBracket.value.r32.length === 16))

// Read-only view of the logged-in user's submitted knockout prediction.
const myKnockoutRounds = computed(() => {
  const ko = mySubmission.value && mySubmission.value.knockout
  if (!ko) return []
  return ROUND_DEFS.map(def => ({
    key: def.key,
    name: def.name,
    matches: (ko[def.key] || []).map(m => ({ teamA: m.teamA, teamB: m.teamB, scoreA: m.scoreA, scoreB: m.scoreB }))
  }))
})
const myKnockoutChampion = computed(() => {
  const f = mySubmission.value && mySubmission.value.knockout && mySubmission.value.knockout.F && mySubmission.value.knockout.F[0]
  if (!f || f.scoreA == null || f.scoreB == null) return null
  return Number(f.scoreA) > Number(f.scoreB) ? f.teamA : f.teamB
})

const teamFlags = {
  'Mexico': 'mx',
  'South Africa': 'za',
  'South Korea': 'kr',
  'Czechia': 'cz',
  'Canada': 'ca',
  'Bosnia and Herzegovina': 'ba',
  'Qatar': 'qa',
  'Switzerland': 'ch',
  'Brazil': 'br',
  'Morocco': 'ma',
  'Haiti': 'ht',
  'Scotland': 'gb-sct',
  'USA': 'us',
  'Paraguay': 'py',
  'Australia': 'au',
  'Turkey': 'tr',
  'Germany': 'de',
  'Curaçao': 'cw',
  'Ivory Coast': 'ci',
  'Ecuador': 'ec',
  'Netherlands': 'nl',
  'Japan': 'jp',
  'Sweden': 'se',
  'Tunisia': 'tn',
  'Belgium': 'be',
  'Egypt': 'eg',
  'Iran': 'ir',
  'New Zealand': 'nz',
  'Spain': 'es',
  'Cape Verde': 'cv',
  'Saudi Arabia': 'sa',
  'Uruguay': 'uy',
  'France': 'fr',
  'Senegal': 'sn',
  'Iraq': 'iq',
  'Norway': 'no',
  'Argentina': 'ar',
  'Algeria': 'dz',
  'Austria': 'at',
  'Jordan': 'jo',
  'Portugal': 'pt',
  'DR Congo': 'cd',
  'Uzbekistan': 'uz',
  'Colombia': 'co',
  'England': 'gb-eng',
  'Croatia': 'hr',
  'Ghana': 'gh',
  'Panama': 'pa'
}

const groups = ref([
  { groupName: 'A', teams: ['Mexico', 'South Africa', 'South Korea', 'Czechia'] },
  { groupName: 'B', teams: ['Canada', 'Bosnia and Herzegovina', 'Qatar', 'Switzerland'] },
  { groupName: 'C', teams: ['Brazil', 'Morocco', 'Haiti', 'Scotland'] },
  { groupName: 'D', teams: ['USA', 'Paraguay', 'Australia', 'Turkey'] },
  { groupName: 'E', teams: ['Germany', 'Curaçao', 'Ivory Coast', 'Ecuador'] },
  { groupName: 'F', teams: ['Netherlands', 'Japan', 'Sweden', 'Tunisia'] },
  { groupName: 'G', teams: ['Belgium', 'Egypt', 'Iran', 'New Zealand'] },
  { groupName: 'H', teams: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'] },
  { groupName: 'I', teams: ['France', 'Senegal', 'Iraq', 'Norway'] },
  { groupName: 'J', teams: ['Argentina', 'Algeria', 'Austria', 'Jordan'] },
  { groupName: 'K', teams: ['Portugal', 'DR Congo', 'Uzbekistan', 'Colombia'] },
  { groupName: 'L', teams: ['England', 'Croatia', 'Ghana', 'Panama'] }
])

const checkEmail = async () => {
  if (!email.value) return
  if (email.value === 'admin@bugloos.com') {
    isAdmin.value = true
    isLoggedIn.value = true
    await fetchAdminResults()
    await loadAdminKnockout()
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await axios.post(`${API_BASE}/check-email`, { email: email.value })
    if (res.data.exists) {
      currentUserSubmission.value = res.data.userSubmission
      mySubmission.value = res.data.userSubmission
      hasSubmitted.value = true
      isLoggedIn.value = true
      await fetchAllSubmissions()
      await fetchKnockoutBracket()
    } else {
      isLoggedIn.value = true
      hasSubmitted.value = false
    }
  } catch (err) {
    error.value = 'Server error. Please try again later.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const fetchScoreboard = async () => {
  try {
    const res = await axios.get(`${API_BASE}/scoreboard`)
    scoreboard.value = Array.isArray(res.data) ? res.data : []
  } catch (err) {
    console.error('Failed to fetch scoreboard', err)
    scoreboard.value = []
  }
}

const fetchSettings = async () => {
  try {
    const res = await axios.get(`${API_BASE}/settings`)
    submissionsEnabled.value = res.data.submissionsEnabled
    knockoutEnabled.value = !!res.data.knockoutEnabled
  } catch (err) {
    console.error('Failed to fetch settings', err)
  }
}

const fetchKnockoutBracket = async () => {
  try {
    const res = await axios.get(`${API_BASE}/knockout-bracket`)
    knockoutBracket.value = res.data || null
  } catch (err) {
    console.error('Failed to fetch knockout bracket', err)
  }
}

const toggleSubmissions = async () => {
  try {
    const newValue = !submissionsEnabled.value
    await axios.post(`${API_BASE}/settings`, { settings: { submissionsEnabled: newValue } })
    submissionsEnabled.value = newValue
  } catch (err) {
    alert('Failed to update settings')
  }
}

const toggleKnockout = async () => {
  try {
    const newValue = !knockoutEnabled.value
    await axios.post(`${API_BASE}/settings`, { settings: { knockoutEnabled: newValue } })
    knockoutEnabled.value = newValue
  } catch (err) {
    alert('Failed to update settings')
  }
}

const loadAdminKnockout = async () => {
  await fetchKnockoutBracket()
  if (knockoutBracket.value && Array.isArray(knockoutBracket.value.r32)) {
    const r32 = knockoutBracket.value.r32
    adminBracket.value = Array.from({ length: 16 }, (_, i) => ({
      teamA: (r32[i] && r32[i].teamA) || '',
      teamB: (r32[i] && r32[i].teamB) || ''
    }))
  }
  try {
    const res = await axios.get(`${API_BASE}/knockout-results`)
    if (res.data) adminKoScores.value = payloadToScores(res.data)
  } catch (err) {
    console.error('Failed to fetch knockout results', err)
  }
}

const saveAdminBracket = async () => {
  if (!adminBracket.value.every(m => m.teamA && m.teamB)) {
    alert('Please select both teams for all 16 Round-of-32 matches.')
    return
  }
  adminKoSaving.value = true
  try {
    await axios.post(`${API_BASE}/knockout-bracket`, {
      bracket: { r32: adminBracket.value.map(m => ({ teamA: m.teamA, teamB: m.teamB })) }
    })
    await fetchKnockoutBracket()
    alert('Knockout bracket saved!')
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to save bracket')
  } finally {
    adminKoSaving.value = false
  }
}

const saveAdminKnockoutResults = async () => {
  adminKoSaving.value = true
  try {
    await axios.post(`${API_BASE}/knockout-results`, { results: roundsToPayload(adminKoRounds.value) })
    alert('Official knockout results saved!')
  } catch (err) {
    alert('Failed to save knockout results')
  } finally {
    adminKoSaving.value = false
  }
}

const fetchAdminResults = async () => {
  try {
    const res = await axios.get(`${API_BASE}/results`)
    const officialResults = res.data || []
    
    // Always show all groups, merging with any saved official results
    const baseGroups = JSON.parse(JSON.stringify(groups.value))
    adminResults.value = baseGroups.map(g => {
      const official = officialResults.find(r => r.groupName === g.groupName)
      if (official) {
        return { ...g, teams: official.teams }
      }
      return g
    })
  } catch (err) {
    console.error('Failed to fetch results', err)
  }
}

const saveAdminResults = async () => {
  submitting.value = true
  try {
    await axios.post(`${API_BASE}/results`, { results: adminResults.value })
    alert('Results saved successfully!')
  } catch (err) {
    alert('Failed to save results')
  } finally {
    submitting.value = false
  }
}

const fetchAllSubmissions = async () => {
  try {
    const res = await axios.get(`${API_BASE}/submissions`)
    allSubmissions.value = Array.isArray(res.data) ? res.data : []
  } catch (err) {
    console.error('Failed to fetch submissions', err)
    allSubmissions.value = []
  }
}

const logout = () => {
  isLoggedIn.value = false
  isAdmin.value = false
  hasSubmitted.value = false
  email.value = ''
  error.value = ''
  currentUserSubmission.value = null
  mySubmission.value = null
  koPredicting.value = false
  koSubmitError.value = ''
  koScores.value = emptyScores()
}

const startKnockout = async () => {
  await fetchKnockoutBracket()
  if (!bracketReady.value) {
    alert('The knockout bracket is not available yet. Please check back later.')
    return
  }
  koScores.value = emptyScores()
  koSubmitError.value = ''
  koPredicting.value = true
}

const cancelKnockout = () => {
  koPredicting.value = false
  koSubmitError.value = ''
}

const submitKnockout = async () => {
  if (!koChampion.value) {
    koSubmitError.value = 'Complete every match (no draws allowed) so a champion is decided.'
    return
  }
  koSubmitting.value = true
  koSubmitError.value = ''
  try {
    await axios.post(`${API_BASE}/submit-knockout`, {
      email: email.value,
      knockout: roundsToPayload(koRounds.value)
    })
    koPredicting.value = false
    await fetchAllSubmissions()
    mySubmission.value = allSubmissions.value.find(s => s.email === email.value) || mySubmission.value
    currentUserSubmission.value = mySubmission.value
    showSuccess.value = true
  } catch (err) {
    koSubmitError.value = err.response?.data?.error || 'Failed to submit knockout prediction. Try again.'
  } finally {
    koSubmitting.value = false
  }
}

const submitPrediction = async () => {
  submitting.value = true
  submitError.value = ''
  try {
    const standings = groups.value.map(g => ({
      groupName: g.groupName,
      teams: g.teams
    }))
    await axios.post(`${API_BASE}/submit`, {
      email: email.value,
      standings
    })
    showConfirm.value = false
    showSuccess.value = true
    await fetchAllSubmissions()
    await fetchKnockoutBracket()
    // Set current user submission from the fetched data
    currentUserSubmission.value = allSubmissions.value.find(s => s.email === email.value)
    mySubmission.value = currentUserSubmission.value
    hasSubmitted.value = true
  } catch (err) {
    submitError.value = err.response?.data?.error || 'Failed to submit. Try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<style>
/* Any additional custom styles can go here */
body {
  margin: 0;
  background-color: #0f172a; /* matches bg-slate-900 */
}
</style>
