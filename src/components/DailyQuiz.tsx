"use client";

import React, { useState, useEffect } from "react";
import { Brain, Trophy, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, Star, Sparkles, Loader2, Clock } from "lucide-react";
import { addPoints } from "@/lib/points";
import { auth } from "@/lib/firebase";

interface Question {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  difficulty?: "easy" | "medium" | "hard" | "very_hard";
}

const STATIC_POOL: Question[] = [
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

export function DailyQuiz() {
  const [mode, setMode] = useState<"static" | "ai" | "score" | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [quizCompletedToday, setQuizCompletedToday] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [confetti, setConfetti] = useState<{ id: number; char: string; left: number; delay: number }[]>([]);

  // Timer States
  const [timer, setTimer] = useState<number>(20);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [playedCount, setPlayedCount] = useState<number>(0);

  const todayStr = new Date().toLocaleDateString("en-CA");
  const storageKey = `quiz_completed_${todayStr}`;
  const scoreKey = `quiz_score_${todayStr}`;
  const countKey = `quiz_played_count_${todayStr}`;
  const staticIdxKey = `quiz_static_idx_${todayStr}`;

  // Helper to calculate difficulty for a given question index (0-19) and date
  const getDifficultyForIndex = (idx: number, dateStr: string) => {
    const dateObj = new Date(dateStr);
    const dayOfMonth = isNaN(dateObj.getDate()) ? new Date().getDate() : dateObj.getDate();
    // Shifting offset by day of month (0 to 3) to make baseline difficulty change daily
    const dayOffset = dayOfMonth % 4; 
    
    const score = idx + dayOffset;
    if (score < 5) return "easy";
    if (score < 10) return "medium";
    if (score < 15) return "hard";
    return "very_hard";
  };

  const currentDifficulty = getDifficultyForIndex(playedCount, todayStr);

  useEffect(() => {
    const completed = localStorage.getItem(storageKey) === "true";
    const savedCount = parseInt(localStorage.getItem(countKey) || "0", 10);
    setPlayedCount(savedCount);

    if (completed || savedCount >= 20) {
      setQuizCompletedToday(true);
      setMode("score");
      const savedScore = localStorage.getItem(scoreKey);
      if (savedScore) {
        setScore(parseInt(savedScore, 10));
      }
    }
  }, []);

  // Timer Effect
  useEffect(() => {
    let intervalId: any;
    if (timerActive && timer > 0 && !isAnswered) {
      intervalId = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timerActive && timer === 0 && !isAnswered) {
      handleTimeUp();
    }
    return () => clearInterval(intervalId);
  }, [timerActive, timer, isAnswered]);

  const markQuestionAsPlayed = (q: Question) => {
    const newPlayed = playedCount + 1;
    setPlayedCount(newPlayed);
    localStorage.setItem(countKey, newPlayed.toString());

    if (mode === "ai") {
      const aiQsKey = `ai_questions_${todayStr}`;
      const existing = JSON.parse(localStorage.getItem(aiQsKey) || "[]");
      if (!existing.some((item: any) => item.question === q.question)) {
        existing.push(q);
        localStorage.setItem(aiQsKey, JSON.stringify(existing));
      }
    } else if (mode === "static") {
      const nextIdx = currentIdx + 1;
      localStorage.setItem(staticIdxKey, nextIdx.toString());
    }

    if (newPlayed >= 20) {
      localStorage.setItem(storageKey, "true");
    }
  };

  const handleTimeUp = () => {
    setTimerActive(false);
    setIsAnswered(true);
    setSelectedOpt(-1); // Special code representing timeout
    setShowExplanation(true);

    const currentQ = questions[currentIdx];
    if (currentQ) {
      markQuestionAsPlayed(currentQ);
    }
  };

  const startStaticQuiz = () => {
    const cacheKey = `static_questions_${todayStr}`;
    const cachedQsStr = localStorage.getItem(cacheKey);
    let selectedQs: Question[] = [];

    if (cachedQsStr) {
      try {
        selectedQs = JSON.parse(cachedQsStr);
      } catch (e) {
        selectedQs = getRandomStaticQuestions(todayStr);
      }
    } else {
      selectedQs = getRandomStaticQuestions(todayStr);
      localStorage.setItem(cacheKey, JSON.stringify(selectedQs));
    }

    setQuestions(selectedQs);
    
    // Resume index based on static idx for the day
    const savedStaticIdx = parseInt(localStorage.getItem(staticIdxKey) || "0", 10);
    const resumeIdx = Math.min(savedStaticIdx, selectedQs.length - 1);
    setCurrentIdx(resumeIdx);

    setSelectedOpt(null);
    setIsAnswered(false);
    setShowExplanation(false);
    setMode("static");

    // Start timer
    setTimer(20);
    setTimerActive(true);
  };

  const getRandomStaticQuestions = (dateStr: string): Question[] => {
    const easyPool = STATIC_POOL.filter(q => q.difficulty === "easy");
    const mediumPool = STATIC_POOL.filter(q => q.difficulty === "medium");
    const hardPool = STATIC_POOL.filter(q => q.difficulty === "hard");
    const veryHardPool = STATIC_POOL.filter(q => q.difficulty === "very_hard");

    // Seeded shuffling function
    const shuffle = (array: Question[]) => {
      const arr = [...array];
      let seed = 0;
      const seedStr = dateStr + (typeof window !== "undefined" ? window.navigator.userAgent : "") + array.length;
      for (let i = 0; i < seedStr.length; i++) {
        seed = seedStr.charCodeAt(i) + ((seed << 5) - seed);
      }
      
      const random = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      };

      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const easyShuffled = shuffle(easyPool);
    const mediumShuffled = shuffle(mediumPool);
    const hardShuffled = shuffle(hardPool);
    const veryHardShuffled = shuffle(veryHardPool);

    const result: Question[] = [];
    let easyPtr = 0, mediumPtr = 0, hardPtr = 0, veryHardPtr = 0;

    for (let idx = 0; idx < 20; idx++) {
      const diff = getDifficultyForIndex(idx, dateStr);
      if (diff === "easy") {
        result.push(easyShuffled[easyPtr++ % easyShuffled.length]);
      } else if (diff === "medium") {
        result.push(mediumShuffled[mediumPtr++ % mediumShuffled.length]);
      } else if (diff === "hard") {
        result.push(hardShuffled[hardPtr++ % hardShuffled.length]);
      } else {
        result.push(veryHardShuffled[veryHardPtr++ % veryHardShuffled.length]);
      }
    }

    return result;
  };

  const generateAiQuestion = async () => {
    setLoadingAi(true);
    setAiError(null);
    setTimerActive(false);

    // Get previous questions asked today to prevent repetition (both static and AI)
    const staticQsKey = `static_questions_${todayStr}`;
    const aiQsKey = `ai_questions_${todayStr}`;
    const staticQs = JSON.parse(localStorage.getItem(staticQsKey) || "[]");
    const aiQs = JSON.parse(localStorage.getItem(aiQsKey) || "[]");
    const previousQuestions = [
      ...staticQs.map((q: any) => q.question),
      ...aiQs.map((q: any) => q.question)
    ];

    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          previousQuestions,
          difficulty: currentDifficulty 
        })
      });
      if (!response.ok) throw new Error("فشل توليد السؤال بواسطة الذكاء الاصطناعي");
      
      const data = await response.json();
      if (data.question && Array.isArray(data.options)) {
        setQuestions([data]);
        setCurrentIdx(0);
        setSelectedOpt(null);
        setIsAnswered(false);
        setShowExplanation(false);
        setMode("ai");

        // Start timer
        setTimer(20);
        setTimerActive(true);
      } else {
        throw new Error("تنسيق بيانات غير صالح");
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoadingAi(false);
    }
  };

  const triggerConfetti = () => {
    const emojis = ["🎉", "✨", "🧠", "🌟", "⭐", "💫", "💡"];
    const items = Array.from({ length: 40 }).map((_, idx) => ({
      id: idx,
      char: emojis[Math.floor(Math.random() * emojis.length)],
      left: Math.random() * 100,
      delay: Math.random() * 1.5
    }));
    setConfetti(items);
  };

  const handleOptionClick = async (optionIdx: number) => {
    if (isAnswered) return;
    setTimerActive(false); // Stop countdown immediately
    setSelectedOpt(optionIdx);
    setIsAnswered(true);
    setShowExplanation(true);

    const currentQ = questions[currentIdx];
    const isCorrect = optionIdx === currentQ.correctAnswerIndex;
    if (isCorrect) {
      const newScore = score + 1;
      setScore(newScore);
      localStorage.setItem(scoreKey, newScore.toString());
      triggerConfetti();

      // Add points
      try {
        await addPoints("bonus", 5);
      } catch (err) {
        console.error("Error adding points:", err);
      }
    }

    markQuestionAsPlayed(currentQ);
  };

  const handleNext = () => {
    if (playedCount >= 20) {
      setQuizCompletedToday(true);
      setMode("score");
      return;
    }

    if (mode === "static" && currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setSelectedOpt(null);
      setIsAnswered(false);
      setShowExplanation(false);
      setTimer(20);
      setTimerActive(true);
    } else if (mode === "static") {
      // Finished all 20 static questions selected for today
      localStorage.setItem(staticIdxKey, "20");
      setQuizCompletedToday(true);
      setMode("score");
    } else {
      // AI Mode completed single question - generate next one
      generateAiQuestion();
    }
  };

  const currentQ = questions[currentIdx];

  return (
    <div className="w-full relative py-8 px-5 md:px-10 bg-card border border-border rounded-[3.5rem] shadow-2xl overflow-hidden font-arabic select-none">
      {/* Background Islamic Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none islamic-pattern" />

      {/* Confetti Rendering */}
      {confetti.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {confetti.map((item) => (
            <span
              key={item.id}
              className="absolute text-2xl animate-fall-fade"
              style={{
                left: `${item.left}%`,
                top: `-20px`,
                animationDelay: `${item.delay}s`,
                animationDuration: "2s"
              }}
            >
              {item.char}
            </span>
          ))}
        </div>
      )}

      {loadingAi ? (
        <div className="py-24 flex flex-col items-center gap-6 relative z-10 animate-pulse">
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
          <div className="space-y-2 text-center">
            <p className="text-primary font-black text-lg">جاري استدعاء خبير الذكاء الاصطناعي (Gemini AI) 🧠✨</p>
            <p className="text-white/40 text-xs font-bold">يتم صياغة سؤال ديني مميز من كتاب الله وسنة رسوله...</p>
          </div>
        </div>
      ) : mode === "score" ? (
        // Score screen for Completed Daily Limit
        <div className="text-center py-12 space-y-8 animate-in zoom-in-95 duration-500 relative z-10">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-amber-500 text-black flex items-center justify-center mx-auto shadow-lg shadow-primary/20 animate-bounce">
            <Trophy className="w-12 h-12" />
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl font-black text-white">أتممت تحدي المعرفة اليوم!</h3>
            <p className="text-foreground/60 text-sm max-w-sm mx-auto">
              الحمد لله، لقد أجبت على تحديات اليوم المعرفية (20 سؤالاً كاملاً) وحصدت النقاط لتزيين ملفك الشخصي.
            </p>
          </div>

          <div className="bg-[#0c0d10] border border-white/5 rounded-3xl p-6 max-w-md mx-auto grid grid-cols-2 gap-4">
            <div className="text-center border-l border-white/5">
              <span className="block text-4xl font-black text-primary font-mono">{score}/20</span>
              <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1 block">الإجابات الصحيحة</span>
            </div>
            <div className="text-center">
              <span className="block text-4xl font-black text-emerald-400 font-mono">+{score * 5}</span>
              <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1 block">نقاط مكتسبة</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
            <button 
              onClick={() => {
                setMode(null);
              }}
              className="w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-xs rounded-2xl transition-all"
            >
              الرجوع للقائمة الرئيسية
            </button>
          </div>
        </div>
      ) : mode === null ? (
        // Selection Mode Screen
        <div className="text-center py-6 space-y-8 relative z-10 animate-in fade-in duration-500">
          <div className="space-y-3">
            <h3 className="text-3xl font-black text-white">
              {quizCompletedToday ? "لقد أكملت تحدي اليوم! 🎉" : "اختر نمط التحدي اليومي"}
            </h3>
            <p className="text-foreground/40 text-sm max-w-md mx-auto">
              {quizCompletedToday 
                ? `الحمد لله، لقد أجبت على 20 سؤالاً اليوم وحصلت على ${score * 5} نقطة. تفضل بزيارة الصفحة غداً لتحدي جديد!`
                : "مجموع التحدي اليومي هو 20 سؤالاً دينية وثقافية. يمكنك الاختيار بين الأسئلة المعتادة أو التوليد بالذكاء الاصطناعي."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Mode 1: Static Daily Quiz */}
            <div 
              onClick={quizCompletedToday ? undefined : startStaticQuiz}
              className={`p-6 rounded-[2.5rem] border text-right transition-all duration-300 relative group flex flex-col justify-between min-h-[180px] ${
                quizCompletedToday 
                  ? "bg-foreground/[0.02] border-border/40 opacity-50 cursor-not-allowed" 
                  : "bg-black/20 border-white/5 hover:border-primary/30 cursor-pointer"
              }`}
            >
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase text-white/50 tracking-wider mb-3">
                  تحدي أسئلة اليوم (20 سؤالاً) 📅
                </span>
                <h4 className="text-lg font-black text-white group-hover:text-primary transition-colors">التحدي اليومي المعتاد</h4>
                <p className="text-white/40 text-xs mt-1 leading-relaxed">
                  20 سؤالاً عشوائياً تتصاعد في الصعوبة من السهل إلى أصعب المستويات، تختلف من شخص لآخر ومن يوم ليوم.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-[10px] text-primary font-black">
                  {quizCompletedToday ? "تم إنجازه اليوم بنجاح ✅" : `التقدم اليومي: ${playedCount}/20 سؤالاً`}
                </span>
                {!quizCompletedToday && <span className="text-xs text-white/20 group-hover:text-primary transition-colors">←</span>}
              </div>
            </div>

            {/* Mode 2: AI Dynamic Quiz */}
            <div 
              onClick={quizCompletedToday ? undefined : generateAiQuestion}
              className={`p-6 rounded-[2.5rem] border text-right transition-all duration-300 relative group flex flex-col justify-between min-h-[180px] ${
                quizCompletedToday 
                  ? "bg-foreground/[0.02] border-border/40 opacity-50 cursor-not-allowed" 
                  : "bg-black/20 border-white/5 hover:border-primary/30 cursor-pointer shadow-lg shadow-primary/5"
              }`}
            >
              <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                <Brain className="w-32 h-32" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/20 text-primary border border-primary/20 rounded-xl text-[9px] font-black uppercase tracking-wider mb-3">
                  توليد فوري بالذكاء الاصطناعي 🧠✨
                </span>
                <h4 className="text-lg font-black text-white group-hover:text-primary transition-colors">تحدي الذكاء الاصطناعي</h4>
                <p className="text-white/40 text-xs mt-1 leading-relaxed">
                  أسئلة تفاعلية فورية تصاغ لك وتزداد صعوبة تدريجياً مع كل سؤال تجيب عليه لتصل لمستوى العلماء في السؤال الأخير!
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-[10px] text-primary font-black">
                  {quizCompletedToday ? "تم إنجازه اليوم بنجاح ✅" : `التقدم اليومي: ${playedCount}/20 سؤالاً`}
                </span>
                {!quizCompletedToday && <span className="text-xs text-white/20 group-hover:text-primary transition-colors">←</span>}
              </div>
            </div>
          </div>

          {quizCompletedToday && (
            <div className="pt-4 max-w-xs mx-auto">
              <button 
                onClick={() => setMode("score")}
                className="w-full py-4 bg-primary text-black font-black text-xs rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <span>عرض تفاصيل درجاتك ونقاطك اليوم 🏆</span>
              </button>
            </div>
          )}

          {aiError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs max-w-md mx-auto flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>فشل الاتصال بالذكاء الاصطناعي، يرجى المحاولة مرة أخرى أو اختيار التحدي المعتاد.</span>
            </div>
          )}
        </div>
      ) : (
        // Question Render Screen (Static or AI Mode)
        <div className="space-y-6 animate-in fade-in duration-500 relative z-10">
          {/* Top progress bar & Timer */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <button 
              onClick={() => {
                setMode(null);
                setTimerActive(false);
              }}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>الرجوع</span>
            </button>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Difficulty Badge */}
              <div className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                currentDifficulty === "easy" 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : currentDifficulty === "medium"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : currentDifficulty === "hard"
                      ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                      : "bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse"
              }`}>
                {currentDifficulty === "easy" 
                  ? "سهل 🟢" 
                  : currentDifficulty === "medium"
                    ? "متوسط 🟡"
                    : currentDifficulty === "hard"
                      ? "صعب 🟠"
                      : "مستوى العلماء 🟣"}
              </div>

              {/* Pulsing Timer Badge */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 ${
                timer <= 5 
                  ? "bg-red-500/10 border-red-500/30 text-red-500 scale-105 animate-pulse" 
                  : "bg-white/5 border-white/10 text-primary"
              }`}>
                <Clock className="w-4 h-4 shrink-0" />
                <span className="text-xs font-black font-mono">
                  {timer} ثانية
                </span>
              </div>

              <div className="flex items-center gap-2 border-r border-white/10 pr-4">
                <Brain className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-xs text-white/80 font-bold">
                  {mode === "ai" 
                    ? `تحدي الذكاء الاصطناعي (${playedCount + 1}/20)` 
                    : `السؤال ${currentIdx + 1} من 20 (إجمالي اليوم: ${playedCount + 1}/20)`}
                </span>
              </div>
            </div>
          </div>

          {/* Visual countdown progress bar */}
          {timerActive && (
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1 relative">
              <div 
                className={`absolute inset-y-0 right-0 transition-all duration-1000 ease-linear ${
                  timer <= 5 ? "bg-red-500 animate-pulse" : "bg-gradient-to-l from-primary to-amber-500"
                }`}
                style={{ width: `${(timer / 20) * 100}%` }}
              />
            </div>
          )}

          {/* Question text */}
          <div className="py-4 text-center min-h-[90px] flex items-center justify-center">
            <h4 className="text-xl md:text-2xl font-black text-white leading-relaxed">
              {currentQ?.question}
            </h4>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQ?.options.map((option, idx) => {
              const isSelected = selectedOpt === idx;
              const isCorrect = idx === currentQ.correctAnswerIndex;
              
              let btnClass = "bg-[#0c0d10] border-white/5 text-white/80 hover:bg-white/5 hover:border-white/10";
              if (isAnswered) {
                if (isCorrect) {
                  btnClass = "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)] scale-[1.02]";
                } else if (isSelected) {
                  btnClass = "bg-red-500/10 border-red-500/50 text-red-400 scale-[0.98]";
                } else {
                  btnClass = "bg-[#0c0d10]/50 border-white/5 text-white/20 opacity-40";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(idx)}
                  disabled={isAnswered}
                  className={`w-full py-4.5 px-6 rounded-2xl border text-right font-bold text-sm transition-all duration-300 flex items-center justify-between ${btnClass}`}
                >
                  <span>{option}</span>
                  {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                  {isAnswered && isSelected && !isCorrect && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Explanation / Feedback block */}
          {showExplanation && (
            <div className="bg-[#0c0d10] border border-white/5 rounded-2xl p-5 space-y-2 animate-in slide-in-from-bottom-2 duration-300 text-right">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5 justify-end">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>
                  {selectedOpt === currentQ?.correctAnswerIndex 
                    ? "إجابة صحيحة متميزة! 🎉 (+5 نقاط)" 
                    : selectedOpt === -1 
                      ? "للأسف، انتهى الوقت! ⏱️" 
                      : "إجابة خاطئة! 💡"}
                </span>
              </span>
              <p className="text-xs text-white/60 leading-relaxed font-medium">
                {currentQ?.explanation}
              </p>
            </div>
          )}

          {/* Next / Generate Button */}
          {isAnswered && (
            <button
              onClick={handleNext}
              className="w-full py-4 bg-primary text-black font-black text-sm rounded-2xl hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              <span>
                {playedCount >= 20 
                  ? "عرض النتيجة الإجمالية 🏆" 
                  : mode === "ai" 
                    ? "توليد سؤال ذكي جديد 🧠✨" 
                    : "السؤال التالي"}
              </span>
              <ArrowLeft className="w-4 h-4 shrink-0 rotate-180" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
