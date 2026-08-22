with open("src/screens/HistoricalDeceased.tsx", "r") as f:
    lines = f.readlines()

out = []
skip = False
for i, line in enumerate(lines):
    if i == 526:
        out.append("""                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date Naissance (Optionnel)</label>
                    <input 
                      type="date"
                      className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006050]/10 text-sm font-semibold text-slate-600 dark:text-slate-300"
                      value={formData.dob}
                      onChange={e => setFormData({...formData, dob: e.target.value})}
                    />
                  </div>
""")
        skip = True
    
    if i == 528:
        skip = False

    if not skip:
        out.append(line)

with open("src/screens/HistoricalDeceased.tsx", "w") as f:
    f.writelines(out)
