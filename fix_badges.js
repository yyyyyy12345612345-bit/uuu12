const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'ProfileModal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings
content = content.replace(/\r?\n/g, '\n');

const target = `                      {activeTab === 'stats' && (
                                  <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center shadow-inner shadow-purple-500/20">
                                     <PlayCircle className="w-6 h-6" />
                                  </div>
                                  <div>
                                     <span className="block text-3xl font-black text-white">{userStats?.completedSurahsCount || 0}</span>
                                     <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black mt-2 block">سور مكتملة</span>
                                  </div>
                               </div>
                            </div>
                         </div>
                      )}`;

const replacement = `                      {activeTab === 'stats' && (
                         <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                               <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-4 hover:bg-white/10 transition-colors shadow-lg">
                                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-inner shadow-primary/20">
                                     <Trophy className="w-6 h-6" />
                                  </div>
                                  <div>
                                     <span className="block text-3xl font-black text-white">{userStats?.totalPoints || 0}</span>
                                     <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black mt-2 block">إجمالي النقاط</span>
                                  </div>
                               </div>
                               
                               <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-4 hover:bg-white/10 transition-colors shadow-lg">
                                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner shadow-emerald-500/20">
                                     <BookOpen className="w-6 h-6" />
                                  </div>
                                  <div>
                                     <span className="block text-3xl font-black text-white">{userStats?.readAyahs || 0}</span>
                                     <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black mt-2 block">آيات قُرئت</span>
                                  </div>
                               </div>
                               
                               <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-4 hover:bg-white/10 transition-colors shadow-lg">
                                  <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-inner shadow-blue-500/20">
                                     <Headphones className="w-6 h-6" />
                                  </div>
                                  <div>
                                     <span className="block text-3xl font-black text-white">{Math.floor((userStats?.audioSeconds || 0) / 60)}</span>
                                     <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black mt-2 block">دقائق استماع</span>
                                  </div>
                               </div>
                               
                               <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-4 hover:bg-white/10 transition-colors shadow-lg">
                                  <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center shadow-inner shadow-purple-500/20">
                                     <PlayCircle className="w-6 h-6" />
                                  </div>
                                  <div>
                                     <span className="block text-3xl font-black text-white">{userStats?.completedSurahsCount || 0}</span>
                                     <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black mt-2 block">سور مكتملة</span>
                                  </div>
                               </div>
                            </div>

                            {/* قسم الأوسمة والشارات */}
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6 shadow-lg">
                               <div className="flex items-center gap-3">
                                  <Trophy className="w-5 h-5 text-primary animate-pulse" />
                                  <h4 className="text-white font-black text-sm">الأوسمة والإنجازات 🏆</h4>
                               </div>
                               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  {BADGES.map((badge) => {
                                     const isUnlocked = userStats?.badges?.includes(badge.id);
                                     
                                     // Calculate progress
                                     let progress = 0;
                                     let currentVal = 0;
                                     let targetVal = 1;
                                     if (badge.id === "streak_7") {
                                        currentVal = userStats?.streak || 0;
                                        targetVal = 7;
                                     } else if (badge.id === "comments_10") {
                                        currentVal = userStats?.commentsCount || 0;
                                        targetVal = 10;
                                     } else if (badge.id === "videos_5") {
                                        currentVal = userStats?.videoRendersCount || 0;
                                        targetVal = 5;
                                     }
                                     progress = Math.min(100, Math.floor((currentVal / targetVal) * 100));

                                     return (
                                        <div 
                                           key={badge.id}
                                           className={`relative rounded-2xl border p-4 flex flex-col items-center text-center gap-3 transition-all duration-300 \${
                                              isUnlocked 
                                                 ? 'bg-primary/5 border-primary/30 shadow-[0_0_20px_rgba(230,190,70,0.1)] hover:scale-[1.03]' 
                                                 : 'bg-white/[0.02] border-white/5 opacity-60'
                                           }`}
                                        >
                                           {/* Badge Icon */}
                                           <div className={`w-14 h-14 rounded-full flex items-center justify-center relative \${
                                              isUnlocked 
                                                 ? 'bg-gradient-to-br from-primary to-amber-500 text-black shadow-lg shadow-primary/20' 
                                                 : 'bg-white/5 text-white/30'
                                           }`}>
                                              {badge.iconType === "quran" && <BookOpen className="w-6 h-6" />}
                                              {badge.iconType === "community" && <Users className="w-6 h-6" />}
                                              {badge.iconType === "video" && <Video className="w-6 h-6" />}
                                              
                                              {isUnlocked && (
                                                 <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#0a0a0d] flex items-center justify-center text-[10px] text-white font-bold">
                                                    ✓
                                                 </span>
                                              )}
                                           </div>

                                           {/* Badge Info */}
                                           <div className="space-y-1">
                                              <span className={`block text-xs font-black \${isUnlocked ? 'text-primary' : 'text-white/60'}`}>
                                                 {badge.name}
                                              </span>
                                              <p className="text-[10px] text-white/40 leading-tight text-center">
                                                 {badge.description}
                                              </p>
                                           </div>

                                           {/* Progress Bar (if locked) */}
                                           {!isUnlocked && (
                                              <div className="w-full mt-2 space-y-1">
                                                 <div className="flex justify-between text-[8px] text-white/30 font-bold font-mono">
                                                    <span>{progress}%</span>
                                                    <span>{currentVal}/{targetVal}</span>
                                                 </div>
                                                 <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div 
                                                       className="h-full bg-white/20 rounded-full transition-all duration-500" 
                                                       style={{ width: `\${progress}%` }}
                                                    />
                                                 </div>
                                              </div>
                                           )}
                                        </div>
                                     );
                                  })}
                               </div>
                            </div>
                         </div>
                      )}`;

if (content.includes(target)) {
  const newContent = content.replace(target, replacement);
  fs.writeFileSync(filePath, newContent.replace(/\n/g, '\r\n'), 'utf8');
  console.log('Successfully updated ProfileModal.tsx!');
} else {
  console.log('Target block not found. Checking if temp comment is there.');
  const targetWithTemp = target.replace("activeTab === 'stats' && (", "activeTab === 'stats' && ( // temp");
  if (content.includes(targetWithTemp)) {
    const newContent = content.replace(targetWithTemp, replacement);
    fs.writeFileSync(filePath, newContent.replace(/\n/g, '\r\n'), 'utf8');
    console.log('Successfully updated ProfileModal.tsx (with temp comment)!');
  } else {
    console.log('Target block still not found. Let us search by regex.');
    const startIndex = content.indexOf("activeTab === 'stats'");
    const endIndex = content.indexOf("activeTab === 'posts'", startIndex);
    if (startIndex !== -1 && endIndex !== -1) {
      const statsSub = content.substring(startIndex, endIndex);
      const lastClose = statsSub.lastIndexOf(')}');
      if (lastClose !== -1) {
        const fullStatsBlock = statsSub.substring(0, lastClose + 2);
        const newContent = content.replace(fullStatsBlock, replacement);
        fs.writeFileSync(filePath, newContent.replace(/\n/g, '\r\n'), 'utf8');
        console.log('Successfully updated ProfileModal.tsx using index offset search!');
      } else {
        console.log('Could not find close tag in stats tab.');
      }
    } else {
      console.log('Could not find activeTab === stats or posts.');
    }
  }
}
