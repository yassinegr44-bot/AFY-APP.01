with open("src/screens/HistoricalDeceased.tsx", "r") as f:
    lines = f.readlines()

out = []
skip = False
for i, line in enumerate(lines):
    if i == 526:
        out.append("""                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Sexe / Genre</label>
                    <select 
                      className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold"
                      value={formData.gender}
                      onChange={e => setFormData({...formData, gender: e.target.value as any})}
                    >
                      <option value="Masculin">Masculin</option>
                      <option value="Féminin">Féminin</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date Naissance (Optionnelle)</label>
                    <input 
                      type="date"
                      className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold"
                      value={formData.dob}
                      onChange={e => setFormData({...formData, dob: e.target.value})}
                    />
                  </div>
                </div>
""")
        skip = True
    
    if i == 555:
        skip = False

    if not skip:
        out.append(line)

with open("src/screens/HistoricalDeceased.tsx", "w") as f:
    f.writelines(out)
