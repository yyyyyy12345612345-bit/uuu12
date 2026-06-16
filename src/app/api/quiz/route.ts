import { NextResponse } from "next/server";

const TOPICS = [
  "سورة البقرة وآياتها وعبرها",
  "قصص الأنبياء في القرآن (نوح، إبراهيم، موسى، عيسى وسليمان عليهم السلام)",
  "غزوة بدر الكبرى وغزوة أحد وغزوة الخندق",
  "حياة الصحابة الكرام (أبو بكر، عمر، عثمان، علي، طلحة، الزبير رضي الله عنهم)",
  "أحكام الصلاة والطهارة والوضوء في الفقه الإسلامي",
  "السنن النبوية والأذكار اليومية الصحيحة",
  "أركان الحج والعمرة ومواقيتها الشرعية",
  "تاريخ جمع وتدوين القرآن الكريم في عهد الصديق وذي النورين",
  "معجزات الأنبياء المذكورة في كتاب الله",
  "سير الخلفاء الراشدين وإنجازاتهم التاريخية",
  "أمهات المؤمنين وزوجات الرسول صلى الله عليه وسلم وسيرتهن العطرة",
  "أركان الإيمان الستة وأثرها على الفرد والمجتمع",
  "فضائل السور والآيات (آية الكرسي، خواتيم سورة البقرة، الكهف، تبارك)",
  "الزكاة ومصارفها الثمانية وشروط وجوبها",
  "قصة أصحاب الكهف والفتية والدروس الإيمانية المستفادة منها",
  "أحكام الصيام ومبطلاته وسنن السحور والإفطار",
  "سورة يوسف والدروس التربوية والاجتماعية المستخلصصة منها",
  "أخلاق النبي صلى الله عليه وسلم وشمائله الكريمة ومعاملته للناس",
  "الإسراء والمعراج وتفاصيل هذه المعجزة العظيمة وفرض الصلاة",
  "فضائل الصدقة والعمل الصالح والإنفاق في سبيل الله",
  "أهمية طلب العلم ومكانة العلماء والتعليم في الإسلام",
  "بر الوالدين وصلة الأرحام وعواقب العقوق والقطيعة",
  "الأدعية المذكورة في القرآن الكريم وسياقها القصصي",
  "أحكام التجويد ومخارج الحروف وقراءة كتاب الله بترتيل",
  "سورة الرحمن وعظمة النعم والآلاء الإلهية المذكورة فيها",
  "سورة الكهف وقصصها الأربع (الفتية، صاحب الجنتين، موسى والخضر، ذو القرنين)",
  "سورة يس وفضائلها ومحاورها العقدية",
  "مباهج الجنة ونعيمها وصفتها المذكورة في القرآن والسنة",
  "أهوال القيامة وعلاماتها الصغرى والكبرى",
  "حقوق الجار واليتيم والضعيف في الإسلام وأهمية التكافل الاجتماعي"
];

const FALLBACK_POOL = [
  // --- EASY (12 questions) ---
  {
    question: "ما هي أطول سورة في القرآن الكريم؟",
    options: ["سورة آل عمران", "سورة النساء", "سورة المائدة", "سورة البقرة"],
    correctAnswerIndex: 3,
    explanation: "سورة البقرة هي أطول سورة في القرآن الكريم، وتبلغ عدد آياتها 286 آية.",
    difficulty: "easy"
  },
  {
    question: "كم عدد السور في القرآن الكريم؟",
    options: ["114 سورة", "110 سور", "120 سورة", "118 سورة"],
    correctAnswerIndex: 0,
    explanation: "يتكون القرآن الكريم من 114 سورة، منها ما هو مكي ومنها ما هو مدني.",
    difficulty: "easy"
  },
  {
    question: "كم عدد الأجزاء في القرآن الكريم؟",
    options: ["28 جزءاً", "30 جزءاً", "60 جزءاً", "114 جزءاً"],
    correctAnswerIndex: 1,
    explanation: "ينقسم القرآن الكريم إلى 30 جزءاً تيسيراً للقراءة والحفظ والمراجعة الدورية.",
    difficulty: "easy"
  },
  {
    question: "من هو النبي الملقب بـ 'كليم الله'؟",
    options: ["إبراهيم عليه السلام", "موسى عليه السلام", "عيسى عليه السلام", "يوسف عليه السلام"],
    correctAnswerIndex: 1,
    explanation: "لقب نبي الله موسى بكليم الله لأن الله سبحانه وتعالى كلّمه كفاحاً ومباشرة دون واسطة في جبل الطور.",
    difficulty: "easy"
  },
  {
    question: "ما هي السورة التي تعدل ثلث القرآن الكريم؟",
    options: ["سورة الفاتحة", "سورة الكافرون", "سورة الإخلاص", "سورة يس"],
    correctAnswerIndex: 2,
    explanation: "سورة الإخلاص تعدل ثلث القرآن لأنها تتمحور بالكامل حول التوحيد وإخلاص العبادة لله وحده لا شريك له.",
    difficulty: "easy"
  },
  {
    question: "ما هي أعظم آية في القرآن الكريم؟",
    options: ["آية الكرسي", "آية الدين", "آخر آية في سورة البقرة", "أول آية في سورة الفاتحة"],
    correctAnswerIndex: 0,
    explanation: "آية الكرسي (الآية 255 من سورة البقرة) هي أعظم آية لما اشتملت عليه من أسماء الله الحسنى وصفات التوحيد والجلال.",
    difficulty: "easy"
  },
  {
    question: "في أي سنة هجرية وقعت غزوة بدر الكبرى؟",
    options: ["السنة الأولى للهجرة", "السنة الثانية للهجرة", "السنة الثالثة للهجرة", "السنة الرابعة للهجرة"],
    correctAnswerIndex: 1,
    explanation: "وقعت غزوة بدر الكبرى في السابع عشر من رمضان في السنة الثانية للهجرة النبوية الشريفة.",
    difficulty: "easy"
  },
  {
    question: "من هو أول من أسلم من الصبيان؟",
    options: ["أبو بكر الصديق", "علي بن أبي طالب", "زيد بن حارثة", "عبد الله بن مسعود"],
    correctAnswerIndex: 1,
    explanation: "علي بن أبي طالب رضي الله عنه كان أول من أسلم من الصبيان وهو ابن عشر سنين.",
    difficulty: "easy"
  },
  {
    question: "ما هي أول عاصمة لدولة الإسلام بعد الهجرة النبوية؟",
    options: ["مكة المكرمة", "المدينة المنورة", "الكوفة", "دمشق"],
    correctAnswerIndex: 1,
    explanation: "المدينة المنورة (يثرب سابقاً) كانت أول عاصمة وحاضرة للدولة الإسلامية الفتية التي أسسها رسول الله صلى الله عليه وسلم.",
    difficulty: "easy"
  },
  {
    question: "ما هي السورة التي تسمى 'أم الكتاب'؟",
    options: ["سورة البقرة", "سورة يس", "سورة الفاتحة", "سورة الإخلاص"],
    correctAnswerIndex: 2,
    explanation: "سورة الفاتحة تسمى أم الكتاب لأنها تفتتح القرآن وتلخص مقاصده وعقائده.",
    difficulty: "easy"
  },
  {
    question: "كم عدد أركان الإسلام؟",
    options: ["3 أركان", "4 أركان", "5 أركان", "6 أركان"],
    correctAnswerIndex: 2,
    explanation: "أركان الإسلام خمسة كما في الحديث الشريف: شهادة أن لا إله إلا الله، وإقام الصلاة، وإيتاء الزكاة، وصوم رمضان، وحج البيت لمن استطاع إليه سبيلاً.",
    difficulty: "easy"
  },
  {
    question: "من هو خاتم الأنبياء والمرسلين؟",
    options: ["عيسى عليه السلام", "موسى عليه السلام", "نوح عليه السلام", "محمد صلى الله عليه وسلم"],
    correctAnswerIndex: 3,
    explanation: "نبينا محمد صلى الله عليه وسلم هو خاتم الأنبياء والرسل كما قال تعالى: (ما كان محمد أبا أحد من رجالكم ولكن رسول الله وخاتم النبيين).",
    difficulty: "easy"
  },

  // --- MEDIUM (12 questions) ---
  {
    question: "ما هي السورة التي تسمى 'عروس القرآن'؟",
    options: ["سورة الرحمن", "سورة يس", "سورة الواقعة", "سورة الملك"],
    correctAnswerIndex: 0,
    explanation: "سورة الرحمن تسمى عروس القرآن لما ورد في بعض الأحاديث والآثار عن جمال فواصلها وعظم نعم الله المذكورة فيها.",
    difficulty: "medium"
  },
  {
    question: "ما معنى كلمة 'الأنفال' الواردة في مطلع السورة الكريمة؟",
    options: ["العهود والمواثيق", "الغنائم والأنصبة", "العبادات والسنن", "المعارك والحروب"],
    correctAnswerIndex: 1,
    explanation: "الأنفال هي الغنائم التي يغنمها المسلمون من عدوهم في الحرب.",
    difficulty: "medium"
  },
  {
    question: "ما معنى كلمة 'قسورة' في قوله تعالى (فرت من قسورة)؟",
    options: ["الأسد", "الغزال", "الحمار الوحشي", "الصياد"],
    correctAnswerIndex: 0,
    explanation: "القسورة في اللغة العربية هي الأسد، والمعنى أن المشركين يفرون من القرآن كالحمر الوحشية التي تفر من الأسد.",
    difficulty: "medium"
  },
  {
    question: "ما هي السورة الوحيدة في القرآن التي لا تبدأ بالبسملة؟",
    options: ["سورة يونس", "سورة هود", "سورة التوبة", "سورة الأنفال"],
    correctAnswerIndex: 2,
    explanation: "سورة التوبة (براءة) لم تبدأ بالبسملة لأنها نزلت بالسيف والبراءة من المشركين والمنافقين، والبسملة رحمة وأمان.",
    difficulty: "medium"
  },
  {
    question: "ما هي السورة التي ذكرت فيها البسملة مرتين؟",
    options: ["سورة النمل", "سورة النحل", "سورة الشعراء", "سورة القصص"],
    correctAnswerIndex: 0,
    explanation: "ذكرت البسملة في سورة النمل مرتين؛ الأولى في مطلع السورة، والثانية في الآية 30: (إنه من سليمان وإنه بسم الله الرحمن الرحيم).",
    difficulty: "medium"
  },
  {
    question: "من هو الصحابي الملقب بـ 'ذي النورين'؟",
    options: ["أبو بكر الصديق", "عمر بن الخطاب", "عثمان بن عفان", "علي بن أبي طالب"],
    correctAnswerIndex: 2,
    explanation: "لقب عثمان بن عفان رضي الله عنه بـ 'ذي النورين' لأنه تزوج من ابنتي رسول الله صلى الله عليه وسلم: رقية ثم أم كلثوم.",
    difficulty: "medium"
  },
  {
    question: "ما هي السورة التي تنتهي بـ 'في جيدها حبل من مسد'؟",
    options: ["سورة الكافرون", "سورة الماعون", "سورة المسد", "سورة الفيل"],
    correctAnswerIndex: 2,
    explanation: "سورة المسد (تبت يدا أبي لهب) تنتهي بوعيد لامرأة أبي لهب بأن يكون في عنقها حبل متين من ليف أو خشن غليظ في النار.",
    difficulty: "medium"
  },
  {
    question: "ما معنى كلمة 'عبس' في قوله تعالى (عبس وتولى)؟",
    options: ["تحدث بصوت مرتفع", "كلح وجهه وقطب ما بين عينيه", "أعرض بجسده بالكامل", "ابتسم واستهزأ"],
    correctAnswerIndex: 1,
    explanation: "عبس تعني قطب ما بين عينيه وكشر وجهه في إشارة لطيفة من الله لرسوله عندما انشغل عن ابن أم مكتوم الأعمى.",
    difficulty: "medium"
  },
  {
    question: "ما هو المسجد الذي وصف في القرآن بأنه 'أُسّس على التقوى من أول يوم'؟",
    options: ["المسجد الحرام", "المسجد النبوي الشريف", "مسجد قباء", "مسجد الأقصى"],
    correctAnswerIndex: 2,
    explanation: "مسجد قباء هو أول مسجد أسس في الإسلام وأول مسجد أسس على التقوى عند وصول النبي صلى الله عليه وسلم إلى المدينة المنورة.",
    difficulty: "medium"
  },
  {
    question: "ما هي سورة يطلق عليها لقب 'قلب القرآن'؟",
    options: ["سورة البقرة", "سورة الرحمن", "سورة الملك", "سورة يس"],
    correctAnswerIndex: 3,
    explanation: "ورد في بعض الآثار تسمية سورة يس بـ 'قلب القرآن' لعظم موضوعاتها وجلال فواصلها ومقاصدها.",
    difficulty: "medium"
  },
  {
    question: "في أي سورة وردت أطول آية في القرآن الكريم؟",
    options: ["سورة آل عمران", "سورة البقرة", "سورة النساء", "سورة المائدة"],
    correctAnswerIndex: 1,
    explanation: "أطول آية في القرآن هي آية الدين (الآية 282 من سورة البقرة) وتتعلق بآداب توثيق المعاملات المالية.",
    difficulty: "medium"
  },
  {
    question: "ما هي السورة الملقبة بـ 'المنجية' من عذاب القبر؟",
    options: ["سورة الكهف", "سورة الواقعة", "سورة الملك", "سورة السجدة"],
    correctAnswerIndex: 2,
    explanation: "سورة الملك (تبارك الذي بيده الملك) هي المنجية والمانعة من عذاب القبر كما ورد في الأثر عن شفاعتها لقارئها.",
    difficulty: "medium"
  },

  // --- HARD (12 questions) ---
  {
    question: "ما معنى كلمة 'الرقيم' في قوله تعالى (أصحاب الكهف والرقيم)؟",
    options: ["الكهف المظلم", "اللوح أو الحجر المنقوش الذي كتبت فيه أسماؤهم", "اسم الجبل الذي يقع فيه الكهف", "اسم الكلب الذي رافقهم"],
    correctAnswerIndex: 1,
    explanation: "الرقيم هو اللوح أو الصخرة المنقوشة التي دُوّن عليها قصة الفتية وأسماؤهم تخليداً لذكراهم.",
    difficulty: "hard"
  },
  {
    question: "ما معنى كلمة 'يهوي' في قوله تعالى (والنجم إذا هوى)؟",
    options: ["يصعد للأعلى", "يسقط أو يغرب", "يلمع بشدة", "ينفجر ويتلاشى"],
    correctAnswerIndex: 1,
    explanation: "هوى النجم أي سقط أو غرب في الأفق.",
    difficulty: "hard"
  },
  {
    question: "ما معنى كلمة 'المهل' في قوله تعالى (يغاثوا بماء كالمهل)؟",
    options: ["الماء العذب البارد", "عكر الزيت أو النحاس والمعادن المذابة شديدة الحرارة", "الدم المسفوح", "العسل المصفى"],
    correctAnswerIndex: 1,
    explanation: "المهل هو الشيء الغليظ شديد الحرارة مثل النحاس المذاب أو عكر الزيت الذي يحرق الوجوه من شدة حرارته.",
    difficulty: "hard"
  },
  {
    question: "من هو الصحابي الجليل الذي اهتز لوفاته عرش الرحمن سبحانه؟",
    options: ["حمزة بن عبد المطلب", "سعد بن معاذ", "جعفر بن أبي طالب", "مصعب بن عمير"],
    correctAnswerIndex: 1,
    explanation: "سعد بن معاذ رضي الله عنه، سيد الأوس، اهتز لوفاته عرش الرحمن فرحاً بقدوم روحه الطيبة واستبشاراً بها.",
    difficulty: "hard"
  },
  {
    question: "ما هي السورة التي تسمى أيضاً بسورة 'بني إسرائيل'؟",
    options: ["سورة يوسف", "سورة الكهف", "سورة الإسراء", "سورة القصص"],
    correctAnswerIndex: 2,
    explanation: "تسمى سورة الإسراء بسورة بني إسرائيل لأنها بدأت بذكر الإسراء ثم أعقبتها مباشرة بذكر إفساد بني إسرائيل في الأرض.",
    difficulty: "hard"
  },
  {
    question: "ما معنى كلمة 'مرصاداً' في قوله تعالى (إن جهنم كانت مرصاداً)؟",
    options: ["مكاناً للراحة والخلود", "مكاناً للترصد والمراقبة لانتظار الكافرين", "مكاناً مغلقاً ومظلماً", "سجناً ضيقاً"],
    correctAnswerIndex: 1,
    explanation: "المرصاد هو المكان الذي يترقب فيه الراصد صيده، أي أن جهنم تترصد الكافرين وتنتظرهم ولا يفلت منها أحد.",
    difficulty: "hard"
  },
  {
    question: "من هو الصحابي الملقب بـ 'أمين هذه الأمة'؟",
    options: ["أبو بكر الصديق", "عمر بن الخطاب", "خالد بن الوليد", "أبو عبيدة بن الجراح"],
    correctAnswerIndex: 3,
    explanation: "لقب النبي صلى الله عليه وسلم الصحابي الجليل أبا عبيدة عامر بن الجراح رضي الله عنه بأمين هذه الأمة.",
    difficulty: "hard"
  },
  {
    question: "ما هي السورة التي تسمى 'السبع المثاني'؟",
    options: ["سورة الفاتحة", "سورة البقرة", "سورة آل عمران", "سورة الإخلاص"],
    correctAnswerIndex: 0,
    explanation: "سورة الفاتحة هي السبع المثاني لأنها سبع آيات وتثنى (تكرر) في كل ركعة من ركعات الصلوات المفروضة والنافلة.",
    difficulty: "hard"
  },
  {
    question: "ما هي السورة التي تسمى 'الفاضحة' لأنها فضحت المنافقين؟",
    options: ["سورة المنافقون", "سورة التوبة", "سورة الأحزاب", "سورة الأنفال"],
    correctAnswerIndex: 1,
    explanation: "تسمى سورة التوبة بالفاضحة لأنها كشفت أسرار المنافقين وفضحت طوايا نفوسهم وأعذارهم الكاذبة.",
    difficulty: "hard"
  },
  {
    question: "كم سنة استمر نزول القرآن الكريم على النبي صلى الله عليه وسلم؟",
    options: ["10 سنوات", "13 سنة", "20 سنة", "23 سنة"],
    correctAnswerIndex: 3,
    explanation: "نزل القرآن الكريم منجماً طوال فترة الدعوة المباركة البالغة 23 سنة (13 سنة بمكة و10 سنوات بالمدينة).",
    difficulty: "hard"
  },
  {
    question: "ما هي السورة التي بدأت باسم ثمرتين؟",
    options: ["سورة التين", "سورة النحل", "سورة الواقعة", "سورة النجم"],
    correctAnswerIndex: 0,
    explanation: "بدأت سورة التين بالقسم بالتين والزيتون في قوله تعالى: (والتين والزيتون وطور سنين).",
    difficulty: "hard"
  },
  {
    question: "من هو الصحابي الذي ذُكر اسمه صراحة في القرآن الكريم؟",
    options: ["أبو بكر الصديق", "علي بن أبي طالب", "زيد بن حارثة", "عبد الرحمن بن عوف"],
    correctAnswerIndex: 2,
    explanation: "زيد بن حارثة هو الصحابي الوحيد الذي ذُكر اسمه صراحة في القرآن في قوله تعالى في سورة الأحزاب: (فلما قضى زيد منها وطراً زوجناكها).",
    difficulty: "hard"
  },

  // --- VERY HARD (12 questions) ---
  {
    question: "في أي غزوة كُسرت رباعية الرسول صلى الله عليه وسلم وشُجّ رأسه الشريف؟",
    options: ["غزوة بدر الكبرى", "غزوة أحد", "غزوة خيبر", "غزوة حنين"],
    correctAnswerIndex: 1,
    explanation: "أصيب النبي صلى الله عليه وسلم في غزوة أحد فكُسرت رباعيته (سنه) وشُجّ رأسه ودخلت حلقتان من حلق المغفر في وجنته الشريفة.",
    difficulty: "very_hard"
  },
  {
    question: "ما معنى قوله تعالى 'والمؤتفكة أهوى' في سورة النجم؟",
    options: ["السحاب الثقال المليء بالمطر", "قرى قوم لوط التي رُفعت ثم قُلبت", "النجوم المتساقطة يوم القيامة", "السفن الجارية في البحر"],
    correctAnswerIndex: 1,
    explanation: "المؤتفكة هي قرى قوم لوط، ومعنى أهوى أي أسقطها مقلوبة بعد أن رفعها جبريل عليه السلام إلى عنان السماء.",
    difficulty: "very_hard"
  },
  {
    question: "من هو أول من كتب 'بسم الله الرحمن الرحيم' من الأنبياء؟",
    options: ["آدم عليه السلام", "سليمان عليه السلام", "نوح عليه السلام", "إبراهيم عليه السلام"],
    correctAnswerIndex: 1,
    explanation: "نبي الله سليمان عليه السلام هو أول من كتب البسملة في رسالته لبلقيس ملكة سبأ كما ورد في القرآن: (إنه من سليمان وإنه بسم الله الرحمن الرحيم).",
    difficulty: "very_hard"
  },
  {
    question: "ما معنى كلمة 'الودق' في قوله تعالى (فترى الودق يخرج من خلاله)؟",
    options: ["البرق اللامع", "المطر والقطرات", "الثلج والبرد", "السحاب الرقيق"],
    correctAnswerIndex: 1,
    explanation: "الودق في لغة العرب هو المطر والقطرات الخارجة من ثنايا السحاب.",
    difficulty: "very_hard"
  },
  {
    question: "ما هي السجدة الأولى في القرآن الكريم في أي سورة تقع؟",
    options: ["سورة البقرة", "سورة الأعراف", "سورة الحج", "سورة النجم"],
    correctAnswerIndex: 1,
    explanation: "أول سجدة تلاوة في المصحف تقع في الآية الأخيرة من سورة الأعراف: (إن الذين عند ربك لا يستكبرون عن عبادته ويسبحونه وله يسجدون).",
    difficulty: "very_hard"
  },
  {
    question: "ما معنى 'حنفاء لله غير مشركين به'؟",
    options: ["مائلين عن الباطل ومستقيمين على التوحيد", "متبعين لشرائع الأنبياء السابقين بالكامل", "مخلصين في المعاملات والعهود", "مكثرين من السجود والركوع"],
    correctAnswerIndex: 0,
    explanation: "الحنيف في اللغة هو المائل، والحنيف في الدين هو المائل عن الشرك والباطل إلى التوحيد والحق والاستقامة عليه لله وحده.",
    difficulty: "very_hard"
  },
  {
    question: "ما هي السورة التي تسمى سورة 'القِتال'؟",
    options: ["سورة الأنفال", "سورة التوبة", "سورة محمد", "سورة الأحزاب"],
    correctAnswerIndex: 2,
    explanation: "تسمى سورة محمد بسورة القتال لورود فرض القتال وأحكامه فيها في مطلع السورة.",
    difficulty: "very_hard"
  },
  {
    question: "ما معنى كلمة 'الحطمة' في سورة الهمزة؟",
    options: ["الصاعقة الشديدة", "المطر الغزير المتلف", "اسم من أسماء النار التي تحطم وتكسر كل ما يلقى فيها", "الحجارة الملتهبة"],
    correctAnswerIndex: 2,
    explanation: "الحطمة اسم من أسماء جهنم وسميت بذلك لأنها تحطم العظام وتأكل اللحوم وتكسر كل شيء بداخلها من شدة حرارتها.",
    difficulty: "very_hard"
  },
  {
    question: "من هي الصحابية التي نزل فيها قوله تعالى (قد سمع الله قول التي تجادلك في زوجها)؟",
    options: ["عائشة بنت أبي بكر", "أم سلمة", "خولة بنت ثعلبة", "حفصة بنت عمر"],
    correctAnswerIndex: 2,
    explanation: "نزلت الآيات الكريمات في الصحابية خولة بنت ثعلبة رضي الله عنها وزوجها أوس بن الصامت عندما ظاهر منها فجاءت تجادل رسول الله وتشتكي إلى الله.",
    difficulty: "very_hard"
  },
  {
    question: "ما معنى كلمة 'الصمد' في سورة الإخلاص؟",
    options: ["الواحد الذي لا مثيل له", "المستغني عن كل أحد المقصود في الحوائج كلها", "الخالق والبارئ والمصور", "الحي القيوم"],
    correctAnswerIndex: 1,
    explanation: "الصمد في التفسير هو السيد الذي كمل في سؤدده والذي تصمد (تقصد) الخلائق إليه في قضاء حوائجها ومسائلها لمعرفتها بعجزه وفضلها وغناه.",
    difficulty: "very_hard"
  },
  {
    question: "في أي سورة وردت قصة 'أصحاب الأخدود'؟",
    options: ["سورة البروج", "سورة الفجر", "سورة الطارق", "سورة الغاشية"],
    correctAnswerIndex: 0,
    explanation: "وردت القصة العظيمة لثبات الفتية والملك والساحر والراهب في سورة البروج في قوله تعالى: (قتل أصحاب الأخدود . النار ذات الوقود).",
    difficulty: "very_hard"
  },
  {
    question: "ما معنى كلمة 'القرين' المذكور في قوله تعالى (وقال قرينه هذا ما لدي عتيد)؟",
    options: ["الملك الموكل بكتابة وحفظ أعماله وسوقه", "الشيطان المصاحب للإنسان في الدنيا لفتنته", "صديقه المقرب في الدنيا", "قرابته وأهله"],
    correctAnswerIndex: 0,
    explanation: "القرين في هذا السياق في سورة ق هو الملك الموكل به الذي يشهد عليه ويسوقه، ويقول هذا ما هو مكتوب ومعد حاضر للجزاء.",
    difficulty: "very_hard"
  }
];

export async function POST(req: Request) {
  try {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.Value || process.env.VALUE;
    const openAiKey = process.env.OPENAI_API_KEY;
    
    // Parse body for previous questions and difficulty
    let previousQuestions: string[] = [];
    let difficulty = "easy";
    try {
      const body = await req.json();
      if (body && Array.isArray(body.previousQuestions)) {
        previousQuestions = body.previousQuestions;
      }
      if (body && typeof body.difficulty === "string") {
        difficulty = body.difficulty;
      }
    } catch (e) {
      // Body may be empty, ignore
    }

    const randomTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

    const systemPrompt = `أنت خبير في العلوم الإسلامية والقرآنية ومسؤول عن وضع أسئلة ثقافية دينية. مهمتك توليد سؤال مسابقة دينية تفاعلية باللغة العربية.
يجب أن ترجع ردك بصيغة JSON فقط دون أي نصوص إضافية أو علامات \`\`\`json.
الهيكل المطلوب:
{
  "question": "السؤال هنا؟",
  "options": ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"],
  "correctAnswerIndex": 0,
  "explanation": "شرح مفصل وواضح مع الاستشهاد بالقرآن أو السنة عند الإمكان"
}
تأكد من أن خياراً واحداً فقط هو الصحيح، وأن تتطابق قيم correctAnswerIndex مع فهرس الخيار الصحيح (0 للفهرس الأول، 1 للثاني، إلخ).`;

    const difficultyText = 
      difficulty === "easy" ? "سهل ومباشر للمبتدئين وعامة الناس" :
      difficulty === "medium" ? "متوسط الصعوبة يتطلب بعض المعرفة والتفكر" :
      difficulty === "hard" ? "صعب ومتقدم يتطلب قراءة وتدبر عميق ودراية بالعلوم الشرعية والحديثية" :
      "صعب جداً ودقيق للغاية يناسب العلماء والباحثين المتخصصين في المتون والتفاسير الدقيقة وتفاصيل اللغة القرآنية";

    const avoidPrompt = previousQuestions.length > 0
      ? `\nتجنب تماماً توليد أي من الأسئلة التالية لأنها عرضت للمستخدم بالفعل اليوم لمنع التكرار:\n${previousQuestions.map((q, i) => `${i + 1}. "${q}"`).join("\n")}`
      : "";

    const userPrompt = `ولد سؤالاً إسلامياً جديداً ومتنوعاً ومحفزاً للتفكير حول موضوع: ${randomTopic}.
مستوى صعوبة السؤال المطلوب بدقة هو: [${difficultyText}].
تأكد أن يكون فريداً ومميزاً وغير متكرر أبداً.${avoidPrompt}`;

    // 1. Try Gemini
    if (geminiKey) {
      const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-pro"];
      for (const model of models) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: controller.signal,
              body: JSON.stringify({
                systemInstruction: {
                  parts: [{ text: systemPrompt }]
                },
                contents: [{
                  role: "user",
                  parts: [{ text: userPrompt }]
                }],
                generationConfig: {
                  temperature: 0.95,
                  maxOutputTokens: 800,
                  responseMimeType: "application/json",
                  responseSchema: {
                    type: "OBJECT",
                    properties: {
                      question: { type: "STRING" },
                      options: { 
                        type: "ARRAY", 
                        items: { type: "STRING" }
                      },
                      correctAnswerIndex: { type: "INTEGER" },
                      explanation: { type: "STRING" }
                    },
                    required: ["question", "options", "correctAnswerIndex", "explanation"]
                  }
                }
              })
            }
          );

          clearTimeout(timeoutId);

          if (response.ok) {
            const resData = await response.json();
            const text = resData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              let cleanText = text.trim();
              if (cleanText.startsWith("```")) {
                cleanText = cleanText.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
              }
              const parsed = JSON.parse(cleanText);
              if (parsed.question && Array.isArray(parsed.options) && parsed.options.length === 4) {
                parsed.correctAnswerIndex = Number(parsed.correctAnswerIndex);
                parsed.isFallback = false; // Add success flag for API
                console.log(`[QUIZ API] Successfully generated question via Gemini model ${model} at difficulty ${difficulty}`);
                return NextResponse.json(parsed);
              }
            }
          } else {
            const errorText = await response.text();
            console.error(`[QUIZ API] Gemini model ${model} failed with status ${response.status}:`, errorText);
          }
        } catch (e: any) {
          console.error(`[QUIZ API] Gemini quiz model ${model} error:`, e.message || e);
        }
      }
    }

    // 2. Try OpenAI fallback
    if (openAiKey) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openAiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.9
          })
        });

        if (response.ok) {
          const resData = await response.json();
          const content = resData.choices?.[0]?.message?.content;
          if (content) {
            let cleanContent = content.trim();
            if (cleanContent.startsWith("```")) {
              cleanContent = cleanContent.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
            }
            const parsed = JSON.parse(cleanContent);
            if (parsed.question && Array.isArray(parsed.options) && parsed.options.length === 4) {
              parsed.correctAnswerIndex = Number(parsed.correctAnswerIndex);
              parsed.isFallback = false; // Add success flag for API
              console.log(`[QUIZ API] Successfully generated question via OpenAI at difficulty ${difficulty}`);
              return NextResponse.json(parsed);
            }
          }
        } else {
          const errorText = await response.text();
          console.error(`[QUIZ API] OpenAI failed with status ${response.status}:`, errorText);
        }
      } catch (e: any) {
        console.error("[QUIZ API] OpenAI quiz error:", e.message || e);
      }
    }

    // 3. Fallback to a static random question from the 48 questions pool if APIs fail
    console.warn(`[QUIZ API] AI Generation failed or keys missing. Falling back to static pool for difficulty ${difficulty}`);
    
    // Choose a question that hasn't been asked today and matches difficulty if possible
    let eligibleQuestions = FALLBACK_POOL.filter(q => q.difficulty === difficulty && !previousQuestions.includes(q.question));
    if (eligibleQuestions.length === 0) {
      eligibleQuestions = FALLBACK_POOL.filter(q => !previousQuestions.includes(q.question));
    }
    if (eligibleQuestions.length === 0) {
      eligibleQuestions = FALLBACK_POOL;
    }
    const randomQ = eligibleQuestions[Math.floor(Math.random() * eligibleQuestions.length)];
    return NextResponse.json({
      ...randomQ,
      isFallback: true // Add fallback indicator
    });

  } catch (err: any) {
    console.error("[QUIZ API] Critical Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
