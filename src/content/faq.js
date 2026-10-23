// Offline bilingual question library. Safety routing runs before keyword matching.
export const FAQ = [
  {
    "id": "pcos",
    "question": {
      "en": "Do I have PCOS?",
      "hi": "क्या मुझे PCOS है?"
    },
    "keywords": {
      "en": [
        "pcos",
        "pcod",
        "polycystic"
      ],
      "hi": [
        "पीसीओएस",
        "पीसीओडी",
        "पॉलीसिस्टिक"
      ]
    },
    "answer": {
      "en": "An app cannot tell. Irregular periods and acne have several causes. A clinician can review your history and decide which checks are useful.",
      "hi": "ऐप यह नहीं बता सकता। अनियमित माहवारी और मुहाँसों के कई कारण हैं। डॉक्टर आपकी जानकारी लेकर ज़रूरी जाँच तय कर सकते हैं।"
    },
    "sourceIds": [
      "pcos"
    ],
    "consult": true
  },
  {
    "id": "late",
    "question": {
      "en": "My period is late. Am I pregnant?",
      "hi": "माहवारी देर से है। क्या मैं गर्भवती हूँ?"
    },
    "keywords": {
      "en": [
        "late",
        "pregnant",
        "pregnancy test",
        "missed period"
      ],
      "hi": [
        "देर",
        "गर्भवती",
        "प्रेग्नेंट",
        "पीरियड नहीं",
        "माहवारी नहीं"
      ]
    },
    "answer": {
      "en": "A late period cannot confirm pregnancy. If pregnancy is possible, follow a home test’s instructions. If tests stay negative and your period does not arrive, see a clinician.",
      "hi": "देर से माहवारी आने से गर्भ की पुष्टि नहीं होती। संभावना हो तो घर की जाँच के निर्देश मानें। जाँच नेगेटिव रहे और माहवारी न आए तो डॉक्टर से मिलें।"
    },
    "sourceIds": [
      "pregnancyTest"
    ],
    "consult": true
  },
  {
    "id": "heavy",
    "question": {
      "en": "I bleed through a pad every hour.",
      "hi": "हर घंटे पैड पूरा भीग जाता है।"
    },
    "keywords": {
      "en": [
        "pad every hour",
        "pad an hour",
        "every 1",
        "every hour",
        "heavy bleeding",
        "heavy period"
      ],
      "hi": [
        "हर घंटे",
        "ज्यादा खून",
        "ज़्यादा खून",
        "बहुत खून",
        "पैड भीग"
      ]
    },
    "answer": {
      "en": "Frequent soaked pads need prompt medical advice. If bleeding is very heavy and you feel dizzy, faint or unwell, get medical help now: 112, or 108 where available.",
      "hi": "बार-बार पूरा भीगा पैड बदलना पड़े तो जल्द चिकित्सा सलाह लें। बहुत खून के साथ चक्कर, बेहोशी या तबीयत खराब हो तो अभी मदद लें: 112, या जहाँ उपलब्ध हो 108।"
    },
    "sourceIds": [
      "heavy",
      "emergency"
    ],
    "consult": true
  },
  {
    "id": "crampsMedicine",
    "question": {
      "en": "Which tablet should I take for cramps?",
      "hi": "ऐंठन के लिए कौन सी गोली लूँ?"
    },
    "keywords": {
      "en": [
        "tablet",
        "medicine",
        "dose",
        "painkiller",
        "ibuprofen",
        "paracetamol"
      ],
      "hi": [
        "गोली",
        "दवा",
        "खुराक",
        "पेनकिलर"
      ]
    },
    "answer": {
      "en": "Ask a pharmacist or clinician what is suitable for your age and health. I cannot choose a medicine or dose. Severe or worsening pain needs medical assessment.",
      "hi": "उम्र और स्वास्थ्य के अनुसार सही दवा के लिए फार्मासिस्ट या डॉक्टर से पूछें। मैं दवा या खुराक नहीं चुन सकता। तेज या बढ़ते दर्द की जाँच कराएँ।"
    },
    "sourceIds": [
      "pain"
    ],
    "consult": true
  },
  {
    "id": "cramps",
    "question": {
      "en": "What can help period cramps?",
      "hi": "माहवारी की ऐंठन में क्या मदद करेगा?"
    },
    "keywords": {
      "en": [
        "cramps",
        "period pain",
        "painful"
      ],
      "hi": [
        "ऐंठन",
        "माहवारी का दर्द",
        "पीरियड दर्द"
      ]
    },
    "answer": {
      "en": "A wrapped warm pack or warm bath may help. Try gentle movement if comfortable. Pain that interrupts your daily life is worth discussing with a clinician.",
      "hi": "कपड़े में लिपटी गर्म बोतल या गर्म पानी से नहाना मदद कर सकता है। आराम लगे तो हल्की गतिविधि करें। दिनचर्या रोकने वाले दर्द पर डॉक्टर से बात करें।"
    },
    "sourceIds": [
      "pain",
      "problems"
    ],
    "consult": true
  },
  {
    "id": "first",
    "question": {
      "en": "I am 14 and my periods are irregular.",
      "hi": "मैं 14 साल की हूँ और माहवारी अनियमित है।"
    },
    "keywords": {
      "en": [
        "14",
        "teen",
        "first year",
        "young"
      ],
      "hi": [
        "14",
        "१४",
        "किशोरी",
        "शुरुआती साल"
      ]
    },
    "answer": {
      "en": "Cycles can vary after periods first begin. Still, tell a trusted adult or clinician about long gaps, very heavy bleeding or pain. A 90-day gap needs assessment.",
      "hi": "माहवारी शुरू होने के बाद चक्र बदल सकते हैं। फिर भी लंबे अंतर, बहुत खून या दर्द के बारे में भरोसेमंद बड़े या डॉक्टर को बताएँ। 90 दिन के अंतर की जाँच ज़रूरी है।"
    },
    "sourceIds": [
      "adolescent"
    ],
    "consult": true
  },
  {
    "id": "cycleStart",
    "question": {
      "en": "How do I count cycle days?",
      "hi": "चक्र के दिन कैसे गिनूँ?"
    },
    "keywords": {
      "en": [
        "count",
        "day 1",
        "cycle day",
        "cycle length"
      ],
      "hi": [
        "गिन",
        "चक्र का दिन",
        "पहला दिन",
        "चक्र की लंबाई"
      ]
    },
    "answer": {
      "en": "Day 1 is the first day of your period. Cycle length is the number of days from that date to the first day of your next period.",
      "hi": "माहवारी का पहला दिन चक्र का दिन 1 है। उस दिन से अगली माहवारी के पहले दिन तक दिनों की संख्या चक्र की लंबाई है।"
    },
    "sourceIds": [
      "cycle"
    ],
    "consult": false
  },
  {
    "id": "longPeriod",
    "question": {
      "en": "My period has lasted more than a week.",
      "hi": "एक हफ़्ते से ज़्यादा माहवारी चल रही है।"
    },
    "keywords": {
      "en": [
        "more than 7",
        "over 7",
        "week",
        "long period",
        "8 days",
        "nine days"
      ],
      "hi": [
        "7 दिन",
        "सात दिन",
        "हफ़्ते",
        "हफ्ते",
        "आठ दिन"
      ]
    },
    "answer": {
      "en": "Bleeding lasting more than 7 days is worth a clinician’s assessment. Note the dates and how often products need changing. Get urgent help if you feel faint with heavy bleeding.",
      "hi": "7 दिन से ज़्यादा खून आने पर डॉक्टर से जाँच कराएँ। तारीख और पैड बदलने की बारंबारता लिखें। भारी खून के साथ बेहोशी लगे तो तुरंत मदद लें।"
    },
    "sourceIds": [
      "heavy"
    ],
    "consult": true
  },
  {
    "id": "gap90",
    "question": {
      "en": "I have not had a period for 3 months.",
      "hi": "तीन महीने से माहवारी नहीं आई।"
    },
    "keywords": {
      "en": [
        "90 days",
        "three months",
        "3 months",
        "no period"
      ],
      "hi": [
        "90 दिन",
        "तीन महीने",
        "3 महीने",
        "माहवारी बंद"
      ]
    },
    "answer": {
      "en": "A gap of 90 days needs medical assessment, even once in adolescence. If pregnancy is possible, take a test too. The app cannot identify the cause.",
      "hi": "90 दिन का अंतर होने पर डॉक्टर से जाँच कराएँ, किशोरावस्था में एक बार भी ऐसा हो तो। गर्भ की संभावना हो तो जाँच भी करें। ऐप कारण नहीं बता सकता।"
    },
    "sourceIds": [
      "adolescent",
      "late"
    ],
    "consult": true
  },
  {
    "id": "stress",
    "question": {
      "en": "Can stress affect my period?",
      "hi": "क्या तनाव माहवारी बदल सकता है?"
    },
    "keywords": {
      "en": [
        "stress",
        "anxiety",
        "exams"
      ],
      "hi": [
        "तनाव",
        "चिंता",
        "परीक्षा"
      ]
    },
    "answer": {
      "en": "Stress can change period timing, but it is not the only possible cause. See a clinician for missed or persistently irregular periods.",
      "hi": "तनाव माहवारी का समय बदल सकता है, लेकिन यही अकेला कारण नहीं है। माहवारी छूटे या लगातार अनियमित रहे तो डॉक्टर से मिलें।"
    },
    "sourceIds": [
      "late"
    ],
    "consult": true
  },
  {
    "id": "weight",
    "question": {
      "en": "Can weight changes affect my period?",
      "hi": "क्या वज़न बदलने से माहवारी बदलती है?"
    },
    "keywords": {
      "en": [
        "weight",
        "weight loss",
        "weight gain"
      ],
      "hi": [
        "वजन",
        "वज़न",
        "मोटापा",
        "दुबली"
      ]
    },
    "answer": {
      "en": "Large weight changes can affect periods. You deserve respectful care at every size. A clinician can help investigate changes without blame.",
      "hi": "वज़न में बड़ा बदलाव माहवारी को प्रभावित कर सकता है। हर वज़न पर सम्मानजनक देखभाल आपका अधिकार है। डॉक्टर बिना दोष दिए कारण जाँच सकते हैं।"
    },
    "sourceIds": [
      "late",
      "pcosNhs"
    ],
    "consult": true
  },
  {
    "id": "acne",
    "question": {
      "en": "Does acne mean PCOS?",
      "hi": "क्या मुहाँसे PCOS का संकेत हैं?"
    },
    "keywords": {
      "en": [
        "acne",
        "pimple",
        "spots",
        "oily skin"
      ],
      "hi": [
        "मुहाँसे",
        "मुंहासे",
        "पिंपल",
        "तैलीय त्वचा"
      ]
    },
    "answer": {
      "en": "Acne alone does not diagnose PCOS. If acne comes with ongoing period changes or unwanted hair growth, a clinician can check possible causes.",
      "hi": "केवल मुहाँसों से PCOS तय नहीं होता। साथ में लगातार माहवारी का बदलाव या अनचाहे बाल हों तो डॉक्टर संभावित कारण जाँच सकते हैं।"
    },
    "sourceIds": [
      "pcos"
    ],
    "consult": true
  },
  {
    "id": "pcosCare",
    "question": {
      "en": "Can PCOS be treated?",
      "hi": "क्या PCOS में इलाज से मदद मिलती है?"
    },
    "keywords": {
      "en": [
        "pcos treatment",
        "pcod treatment",
        "cure",
        "treat pcos"
      ],
      "hi": [
        "पीसीओएस का इलाज",
        "पीसीओडी का इलाज",
        "ठीक हो"
      ]
    },
    "answer": {
      "en": "Care can help manage PCOS symptoms. A clinician tailors treatment to your needs, including periods, skin symptoms and pregnancy goals. Do not start hormones without medical advice.",
      "hi": "देखभाल से PCOS के लक्षण सँभल सकते हैं। डॉक्टर माहवारी, त्वचा और गर्भधारण की ज़रूरत के अनुसार इलाज चुनते हैं। बिना चिकित्सा सलाह हार्मोन न लें।"
    },
    "sourceIds": [
      "pcosNhs"
    ],
    "consult": true
  },
  {
    "id": "pcodName",
    "question": {
      "en": "Why do I see both PCOD and PCOS?",
      "hi": "PCOD और PCOS दोनों शब्द क्यों दिखते हैं?"
    },
    "keywords": {
      "en": [
        "pcod and pcos",
        "pcod vs pcos",
        "difference",
        "same"
      ],
      "hi": [
        "अंतर",
        "फर्क",
        "पीसीओडी और पीसीओएस",
        "pcod और pcos",
        "एक ही"
      ]
    },
    "answer": {
      "en": "A FOGSI clinical algorithm booklet expands PCOD as polycystic ovarian disease and PCOS as polycystic ovarian syndrome, and uses both terms. It does not clearly say whether they mean different diagnoses or alternate names. Saheli uses PCOS as its main clinical term. If your report says PCOD, ask the clinician who issued it what they mean and what was assessed. A label or scan alone is not a diagnosis.",
      "hi": "FOGSI की एक चिकित्सकीय एल्गोरिदम पुस्तिका में PCOD का पूरा नाम polycystic ovarian disease और PCOS का polycystic ovarian syndrome दिया गया है। पुस्तिका दोनों शब्द इस्तेमाल करती है, लेकिन यह साफ़ नहीं बताती कि वे अलग निदान हैं या एक ही स्थिति के अलग नाम। Saheli मुख्य चिकित्सकीय नाम के रूप में PCOS इस्तेमाल करता है। अगर आपकी रिपोर्ट में PCOD लिखा हो, तो उसे जारी करने वाले डॉक्टर से पूछें कि उनका क्या मतलब है और किन बातों की जाँच हुई। केवल नाम या स्कैन से निदान नहीं होता।"
    },
    "sourceIds": [
      "fogsiTerms",
      "pcosGuideline",
      "pcos"
    ],
    "consult": false
  },
  {
    "id": "mood",
    "question": {
      "en": "Why does my mood change before my period?",
      "hi": "माहवारी से पहले मन क्यों बदलता है?"
    },
    "keywords": {
      "en": [
        "mood",
        "emotional",
        "irritable",
        "pms"
      ],
      "hi": [
        "मूड",
        "मन बदल",
        "चिड़चिड़",
        "पीएमएस"
      ]
    },
    "answer": {
      "en": "Some people notice emotional or physical symptoms before periods, called PMS. Track how you feel. If this affects daily life, ask a healthcare professional for support.",
      "hi": "कुछ लोगों को माहवारी से पहले मन या शरीर में बदलाव होते हैं, जिन्हें PMS कहते हैं। अपनी तबीयत लिखें। दिनचर्या पर असर हो तो स्वास्थ्यकर्मी से मदद लें।"
    },
    "sourceIds": [
      "pms"
    ],
    "consult": true
  },
  {
    "id": "lowMood",
    "question": {
      "en": "I feel very low.",
      "hi": "मैं बहुत उदास महसूस करती हूँ।"
    },
    "keywords": {
      "en": [
        "very low",
        "depressed",
        "very sad",
        "hopeless"
      ],
      "hi": [
        "बहुत उदास",
        "निराश",
        "मन बहुत खराब"
      ]
    },
    "answer": {
      "en": "If you feel very low, you deserve support; you do not need to wait for a pattern. Talk to someone you trust or a healthcare professional. Tele MANAS: 14416. If you may hurt yourself, get immediate help through 112.",
      "hi": "बहुत उदास महसूस होने पर मदद लेना ठीक है। आपको सहारा मिलना चाहिए; किसी पैटर्न का इंतज़ार ज़रूरी नहीं है। भरोसेमंद व्यक्ति या स्वास्थ्यकर्मी से बात करें। Tele MANAS: 14416। खुद को चोट पहुँचाने का डर हो तो तुरंत 112 से मदद लें।"
    },
    "sourceIds": [
      "mentalHealth",
      "pms"
    ],
    "consult": true
  },
  {
    "id": "selfHarm",
    "question": {
      "en": "I feel like hurting myself.",
      "hi": "मेरा खुद को नुकसान पहुँचाने का मन है।"
    },
    "keywords": {
      "en": [
        "hurt myself",
        "hurting myself",
        "harm myself",
        "self-harm",
        "suicide",
        "kill myself"
      ],
      "hi": [
        "खुद को नुकसान",
        "आत्महत्या",
        "खुद को चोट"
      ]
    },
    "answer": {
      "en": "You deserve support right now. If you might act on these thoughts, call 112 or go to the nearest emergency department. Stay with someone you trust and move away from things you could use to hurt yourself. You can also call Tele MANAS on 14416.",
      "hi": "आपको अभी सहारा मिलना चाहिए। अगर इन विचारों पर अमल करने का डर है, तो 112 पर कॉल करें या पास के आपातकालीन विभाग जाएँ। किसी भरोसेमंद व्यक्ति के साथ रहें और खुद को चोट पहुँचाने वाली चीज़ों से दूर रहें। Tele MANAS पर 14416 भी कॉल कर सकते हैं।"
    },
    "sourceIds": [
      "mentalHealth",
      "emergency"
    ],
    "consult": true
  },
  {
    "id": "bloating",
    "question": {
      "en": "Is bloating linked to my period?",
      "hi": "क्या पेट फूलना माहवारी से जुड़ सकता है?"
    },
    "keywords": {
      "en": [
        "bloat",
        "bloating",
        "breast tenderness"
      ],
      "hi": [
        "पेट फूल",
        "स्तन में दर्द"
      ]
    },
    "answer": {
      "en": "Bloating or breast tenderness can occur before periods. A diary may show a pattern. New, persistent or troubling symptoms deserve a clinician’s advice.",
      "hi": "माहवारी से पहले पेट फूलना या स्तनों में दर्द हो सकता है। डायरी पैटर्न दिखा सकती है। नए, लगातार या परेशान करने वाले लक्षण पर डॉक्टर से सलाह लें।"
    },
    "sourceIds": [
      "pms"
    ],
    "consult": true
  },
  {
    "id": "tired",
    "question": {
      "en": "Why am I so tired during heavy periods?",
      "hi": "भारी माहवारी में बहुत थकान क्यों होती है?"
    },
    "keywords": {
      "en": [
        "tired",
        "fatigue",
        "anaemia",
        "anemia",
        "breathless"
      ],
      "hi": [
        "थकान",
        "कमज़ोरी",
        "कमजोरी",
        "खून की कमी",
        "साँस फूल"
      ]
    },
    "answer": {
      "en": "Heavy bleeding with tiredness or breathlessness needs assessment. A clinician may check for low iron or other causes. Do not assume tiredness is only from your period.",
      "hi": "भारी खून के साथ थकान या साँस फूलने की जाँच ज़रूरी है। डॉक्टर आयरन की कमी या अन्य कारण जाँच सकते हैं। थकान को केवल माहवारी का असर न मानें।"
    },
    "sourceIds": [
      "heavy"
    ],
    "consult": true
  },
  {
    "id": "between",
    "question": {
      "en": "I bleed between periods or after sex.",
      "hi": "माहवारी के बीच या सेक्स के बाद खून आता है।"
    },
    "keywords": {
      "en": [
        "between periods",
        "after sex",
        "spotting"
      ],
      "hi": [
        "बीच में खून",
        "सेक्स के बाद",
        "स्पॉटिंग"
      ]
    },
    "answer": {
      "en": "Have unusual bleeding checked by a clinician. If you missed a period and have bleeding with belly pain, seek urgent care, even without a positive pregnancy test.",
      "hi": "असामान्य खून की डॉक्टर से जाँच कराएँ। माहवारी छूटने के बाद खून और पेट दर्द हो तो तुरंत मदद लें, चाहे गर्भ की जाँच पॉज़िटिव न हो।"
    },
    "sourceIds": [
      "bleeding"
    ],
    "consult": true
  },
  {
    "id": "suddenPain",
    "question": {
      "en": "I have sudden severe lower-belly pain.",
      "hi": "पेट के निचले हिस्से में अचानक तेज दर्द है।"
    },
    "keywords": {
      "en": [
        "sudden severe",
        "severe belly pain",
        "faint",
        "collapse"
      ],
      "hi": [
        "अचानक तेज",
        "बेहोश",
        "तेज पेट दर्द"
      ]
    },
    "answer": {
      "en": "Get medical help now. Call 112, or 108 for an ambulance where available. Sudden severe lower-belly pain, very heavy bleeding with dizziness or fainting, or bleeding or severe pain when pregnancy is possible need urgent assessment.",
      "hi": "अभी चिकित्सा मदद लें। 112 पर कॉल करें, या जहाँ उपलब्ध हो वहाँ एम्बुलेंस के लिए 108 पर कॉल करें। पेट के निचले हिस्से में अचानक तेज दर्द, बहुत खून के साथ चक्कर या बेहोशी, या गर्भ की संभावना के साथ खून या तेज दर्द होने पर तुरंत जाँच ज़रूरी है।"
    },
    "sourceIds": [
      "ectopic",
      "emergency"
    ],
    "consult": true
  },
  {
    "id": "ovulation",
    "question": {
      "en": "What is ovulation?",
      "hi": "अंडोत्सर्ग क्या है?"
    },
    "keywords": {
      "en": [
        "ovulation",
        "release an egg"
      ],
      "hi": [
        "अंडोत्सर्ग",
        "अंडा निकल"
      ]
    },
    "answer": {
      "en": "Ovulation is the release of an egg from an ovary. Its timing varies. This app cannot confirm it. Estimates cannot be used to prevent pregnancy.",
      "hi": "अंडोत्सर्ग यानी अंडाशय से अंडे का निकलना। इसका समय बदलता है। ऐप इसकी पुष्टि नहीं कर सकता। अनुमान का उपयोग गर्भ रोकने के लिए नहीं कर सकते।"
    },
    "sourceIds": [
      "cycle"
    ],
    "consult": false
  },
  {
    "id": "safeDays",
    "question": {
      "en": "Are there safe days to prevent pregnancy?",
      "hi": "क्या गर्भ रोकने के लिए सुरक्षित दिन होते हैं?"
    },
    "keywords": {
      "en": [
        "safe days",
        "safe time",
        "prevent pregnancy",
        "contraception",
        "fertile"
      ],
      "hi": [
        "सुरक्षित दिन",
        "गर्भ रोक",
        "गर्भनिरोध",
        "फर्टाइल"
      ]
    },
    "answer": {
      "en": "Cycle estimates cannot tell you a time that guarantees no pregnancy. Ask a qualified clinician about reliable contraception that suits you.",
      "hi": "चक्र के अनुमान ऐसा समय नहीं बता सकते जब गर्भ न होने की गारंटी हो। अपने लिए सही भरोसेमंद गर्भनिरोध के बारे में योग्य डॉक्टर से पूछें।"
    },
    "sourceIds": [
      "cycle"
    ],
    "consult": false
  },
  {
    "id": "prediction",
    "question": {
      "en": "Why is the prediction a date range?",
      "hi": "अनुमान में कई तारीखें क्यों हैं?"
    },
    "keywords": {
      "en": [
        "prediction",
        "estimate",
        "date range",
        "accurate"
      ],
      "hi": [
        "अनुमान",
        "तारीख",
        "सटीक"
      ]
    },
    "answer": {
      "en": "Past cycle lengths vary, so the next date is uncertain. Saheli shows a range and hides ovulation estimates for irregular cycles. A prediction is not a medical result.",
      "hi": "पिछले चक्रों की लंबाई बदलती है, इसलिए अगली तारीख तय नहीं। सहेली एक सीमा दिखाता है और अनियमित चक्र में अंडोत्सर्ग अनुमान छिपाता है। अनुमान जाँच का नतीजा नहीं है।"
    },
    "sourceIds": [
      "irregular"
    ],
    "consult": false
  },
  {
    "id": "pad",
    "question": {
      "en": "How do I use a pad?",
      "hi": "पैड कैसे इस्तेमाल करूँ?"
    },
    "keywords": {
      "en": [
        "pad",
        "sanitary towel"
      ],
      "hi": [
        "पैड",
        "नैपकिन"
      ]
    },
    "answer": {
      "en": "Place it in your underwear as directed. Change it when wet or uncomfortable and follow the pack’s instructions. Wash your hands before and after changing.",
      "hi": "पैक के निर्देश अनुसार इसे अंडरवियर में लगाएँ। गीला या असुविधाजनक लगे तो बदलें और पैक के निर्देश मानें। बदलने से पहले और बाद में हाथ धोएँ।"
    },
    "sourceIds": [
      "hygiene",
      "products",
      "productSafety"
    ],
    "consult": false
  },
  {
    "id": "cup",
    "question": {
      "en": "How do I use a menstrual cup safely?",
      "hi": "मेंस्ट्रुअल कप सुरक्षित तरीके से कैसे लगाऊँ?"
    },
    "keywords": {
      "en": [
        "cup",
        "menstrual cup"
      ],
      "hi": [
        "कप",
        "मेंस्ट्रुअल"
      ]
    },
    "answer": {
      "en": "A cup collects blood inside the vagina. Follow its instructions for insertion, removal, emptying and cleaning. Wash your hands. Do not force it if it hurts.",
      "hi": "कप योनि के अंदर खून इकट्ठा करता है। लगाने, निकालने, खाली करने और साफ़ करने के निर्देश मानें। हाथ धोएँ। दर्द हो तो ज़ोर न लगाएँ।"
    },
    "sourceIds": [
      "products",
      "productSafety"
    ],
    "consult": false
  },
  {
    "id": "cloth",
    "question": {
      "en": "Can I use reusable cloth?",
      "hi": "क्या कपड़ा दोबारा इस्तेमाल कर सकती हूँ?"
    },
    "keywords": {
      "en": [
        "cloth",
        "reusable",
        "wash"
      ],
      "hi": [
        "कपड़ा",
        "धोना",
        "दोबारा"
      ]
    },
    "answer": {
      "en": "Use clean absorbent cloth. Wash with soap and clean water, dry fully in sunlight where possible, and store dry. Never reuse dirty or damp cloth.",
      "hi": "साफ़ और सोखने वाला कपड़ा लें। साबुन और साफ़ पानी से धोएँ, संभव हो तो धूप में पूरी तरह सुखाएँ और सूखा रखें। गंदा या गीला कपड़ा दोबारा न लगाएँ।"
    },
    "sourceIds": [
      "cloth"
    ],
    "consult": false
  },
  {
    "id": "exercise",
    "question": {
      "en": "Can I exercise during my period?",
      "hi": "क्या माहवारी में व्यायाम कर सकती हूँ?"
    },
    "keywords": {
      "en": [
        "exercise",
        "walk",
        "sport",
        "workout"
      ],
      "hi": [
        "व्यायाम",
        "खेल",
        "टहल",
        "कसरत"
      ]
    },
    "answer": {
      "en": "Gentle activity may help cramps if it feels comfortable. Listen to your body. Pain or heavy bleeding that stops normal activities deserves medical care.",
      "hi": "आराम लगे तो हल्की गतिविधि ऐंठन में मदद कर सकती है। शरीर की बात सुनें। दर्द या भारी खून से सामान्य काम रुकें तो चिकित्सा मदद लें।"
    },
    "sourceIds": [
      "pain",
      "problems"
    ],
    "consult": true
  },
  {
    "id": "diet",
    "question": {
      "en": "Can a special food fix my cycle?",
      "hi": "क्या खास खाना चक्र ठीक कर देगा?"
    },
    "keywords": {
      "en": [
        "diet",
        "supplement",
        "food",
        "seed cycling",
        "cure food"
      ],
      "hi": [
        "खाना",
        "डाइट",
        "सप्लीमेंट",
        "बीज",
        "चमत्कारी"
      ]
    },
    "answer": {
      "en": "No special food can diagnose or guarantee a regular cycle. Balanced everyday eating supports general health. Ask a clinician before starting supplements for period symptoms.",
      "hi": "कोई खास खाना निदान या नियमित चक्र की गारंटी नहीं देता। संतुलित रोज़ का खाना सामान्य स्वास्थ्य में मदद करता है। लक्षणों के लिए सप्लीमेंट शुरू करने से पहले डॉक्टर से पूछें।"
    },
    "sourceIds": [
      "pms",
      "pcosNhs"
    ],
    "consult": false
  },
  {
    "id": "noFirstPeriod",
    "question": {
      "en": "I am 15 and have never had a period.",
      "hi": "मैं 15 साल की हूँ और माहवारी शुरू नहीं हुई।"
    },
    "keywords": {
      "en": [
        "never had",
        "not started",
        "age 15",
        "no first period"
      ],
      "hi": [
        "शुरू नहीं",
        "15 साल",
        "१५ साल",
        "पहली नहीं"
      ]
    },
    "answer": {
      "en": "Arrange a clinician’s appointment if periods have not started by age 15. There are different possible reasons, and a clinician can guide the checks.",
      "hi": "15 साल तक माहवारी शुरू न हुई हो तो डॉक्टर से मिलने का समय लें। इसके अलग कारण हो सकते हैं और डॉक्टर ज़रूरी जाँच बता सकते हैं।"
    },
    "sourceIds": [
      "firstPeriod",
      "adolescent"
    ],
    "consult": true
  },
  {
    "id": "firstSupplies",
    "question": {
      "en": "What should I keep for my first period?",
      "hi": "पहली माहवारी के लिए क्या साथ रखूँ?"
    },
    "keywords": {
      "en": [
        "first period",
        "school",
        "supplies",
        "first time"
      ],
      "hi": [
        "पहली माहवारी",
        "पहला पीरियड",
        "स्कूल",
        "साथ रखूँ"
      ]
    },
    "answer": {
      "en": "Keep a pad, spare underwear and a small bag if possible. A trusted adult or school health worker can help. Needing help is nothing to be ashamed of.",
      "hi": "संभव हो तो पैड, अतिरिक्त अंडरवियर और छोटा बैग रखें। भरोसेमंद बड़े या स्कूल के स्वास्थ्यकर्मी मदद कर सकते हैं। मदद माँगने में शर्म की बात नहीं है।"
    },
    "sourceIds": [
      "firstPeriod"
    ],
    "consult": false
  },
  {
    "id": "brownBlood",
    "question": {
      "en": "Why is period blood sometimes brown?",
      "hi": "माहवारी का खून कभी भूरा क्यों होता है?"
    },
    "keywords": {
      "en": [
        "brown",
        "blood colour",
        "color"
      ],
      "hi": [
        "भूरा",
        "रंग"
      ]
    },
    "answer": {
      "en": "Period blood can look red or brown, especially with lighter flow. Colour alone cannot show the cause. Unusual bleeding, pain or other concerns should be checked.",
      "hi": "माहवारी का खून लाल या भूरा दिख सकता है, खासकर हल्के बहाव में। रंग से अकेले कारण पता नहीं चलता। असामान्य खून, दर्द या चिंता हो तो जाँच कराएँ।"
    },
    "sourceIds": [
      "firstPeriod",
      "periods"
    ],
    "consult": true
  },
  {
    "id": "clots",
    "question": {
      "en": "I pass large blood clots.",
      "hi": "खून के बड़े थक्के आते हैं।"
    },
    "keywords": {
      "en": [
        "clot",
        "coin"
      ],
      "hi": [
        "थक्के",
        "थक्का",
        "सिक्का"
      ]
    },
    "answer": {
      "en": "Repeated clots larger than about 2.5 cm, roughly a ₹10 coin, can be a sign of heavy bleeding. Discuss them with a clinician; record the dates and flow.",
      "hi": "लगभग 2.5 सेमी, यानी करीब ₹10 के सिक्के से बड़े थक्के बार-बार आना भारी खून का संकेत हो सकता है। तारीख और बहाव लिखकर डॉक्टर से बात करें।"
    },
    "sourceIds": [
      "heavy"
    ],
    "consult": true
  },
  {
    "id": "menopause",
    "question": {
      "en": "I have bleeding after menopause.",
      "hi": "मेनोपॉज़ के बाद खून आया है।"
    },
    "keywords": {
      "en": [
        "menopause",
        "postmenopausal"
      ],
      "hi": [
        "मेनोपॉज़",
        "मेनोपॉज",
        "रजोनिवृत्ति"
      ]
    },
    "answer": {
      "en": "Any bleeding after menopause needs a clinician’s check, even a small amount or one episode. The app cannot tell the cause.",
      "hi": "मेनोपॉज़ के बाद कोई भी खून आए तो डॉक्टर से जाँच कराएँ, चाहे थोड़ा हो या एक बार आया हो। ऐप कारण नहीं बता सकता।"
    },
    "sourceIds": [
      "menopause"
    ],
    "consult": true
  },
  {
    "id": "pregnancyMode",
    "question": {
      "en": "When should I turn on pregnancy mode?",
      "hi": "गर्भावस्था मोड कब चालू करूँ?"
    },
    "keywords": {
      "en": [
        "pregnancy mode",
        "positive test",
        "confirmed pregnancy"
      ],
      "hi": [
        "गर्भावस्था मोड",
        "पॉज़िटिव जाँच",
        "गर्भ की पुष्टि"
      ]
    },
    "answer": {
      "en": "Use it after a positive pregnancy test or a clinician’s confirmation. It pauses period predictions. It provides education and estimates, not a substitute for antenatal care.",
      "hi": "गर्भ जाँच पॉज़िटिव होने या डॉक्टर की पुष्टि के बाद चालू करें। इससे माहवारी के अनुमान रुकते हैं। यह जानकारी और अनुमान देता है; गर्भावस्था की चिकित्सा देखभाल की जगह नहीं है।"
    },
    "sourceIds": [
      "pregnancyTest",
      "antenatal"
    ],
    "consult": false
  },
  {
    "id": "dueDate",
    "question": {
      "en": "How is my due date estimated?",
      "hi": "प्रसव की अनुमानित तारीख कैसे निकलती है?"
    },
    "keywords": {
      "en": [
        "due date",
        "pregnancy week",
        "280",
        "40 weeks"
      ],
      "hi": [
        "प्रसव तारीख",
        "कितने सप्ताह",
        "कितने हफ्ते",
        "ड्यू डेट"
      ]
    },
    "answer": {
      "en": "This prototype adds 280 days to the first day of your last period. This is an estimate; irregular cycles make it less certain. A clinician may revise it after a scan.",
      "hi": "यह प्रोटोटाइप आखिरी माहवारी के पहले दिन में 280 दिन जोड़ता है। यह अनुमान है; अनियमित चक्र में अनिश्चितता बढ़ती है। स्कैन के बाद डॉक्टर इसे बदल सकते हैं।"
    },
    "sourceIds": [
      "dueDate",
      "scans"
    ],
    "consult": false
  },
  {
    "id": "pregnancyWarning",
    "question": {
      "en": "Which pregnancy symptoms need urgent help?",
      "hi": "गर्भावस्था में किन लक्षणों पर तुरंत मदद लें?"
    },
    "keywords": {
      "en": [
        "pregnancy danger",
        "pregnancy warning",
        "baby moving less",
        "blurred vision",
        "leaking fluid"
      ],
      "hi": [
        "गर्भ में खतरा",
        "बच्चा कम हिल",
        "धुंधला",
        "पानी निकल"
      ]
    },
    "answer": {
      "en": "Contact maternity care urgently for bleeding, severe belly pain or headache, vision changes, sudden swelling, fever, leaking fluid or reduced baby movements. Do not wait for an app alert.",
      "hi": "खून, पेट या सिर में तेज दर्द, नज़र में बदलाव, अचानक सूजन, बुखार, पानी निकलना या बच्चे की हरकत कम होने पर तुरंत गर्भावस्था की चिकित्सा मदद लें। ऐप की सूचना का इंतज़ार न करें।"
    },
    "sourceIds": [
      "pregnancyWarning"
    ],
    "consult": true
  },
  {
    "id": "privacy",
    "question": {
      "en": "Does Saheli send my data anywhere?",
      "hi": "क्या सहेली मेरा डेटा कहीं भेजता है?"
    },
    "keywords": {
      "en": [
        "privacy",
        "data",
        "private",
        "server",
        "account"
      ],
      "hi": [
        "गोपनीयता",
        "डेटा",
        "निजी",
        "सर्वर",
        "अकाउंट"
      ]
    },
    "answer": {
      "en": "Your logs and offline questions stay in this browser. No account is needed. Export files and printed summaries are your responsibility to store privately. External source links open only if you choose them.",
      "hi": "आपके रिकॉर्ड और ऑफलाइन सवाल इसी ब्राउज़र में रहते हैं। अकाउंट की ज़रूरत नहीं। निर्यात फ़ाइल और प्रिंट की जानकारी सुरक्षित रखें। बाहरी स्रोत लिंक केवल आपके चुनने पर खुलते हैं।"
    },
    "sourceIds": [],
    "consult": false
  },
  {
    "id": "illness",
    "question": {
      "en": "Can illness affect my periods?",
      "hi": "क्या बीमारी का माहवारी से संबंध हो सकता है?"
    },
    "keywords": {
      "en": [
        "illness",
        "been ill",
        "was ill",
        "sick recently",
        "chronic condition"
      ],
      "hi": [
        "बीमारी",
        "बीमार थी",
        "बीमार हूँ",
        "बीमार हूं",
        "तबीयत खराब"
      ]
    },
    "answer": {
      "en": "Illness can be relevant when a clinician investigates changed or absent periods. Tell them about recent illness, medicines and other symptoms. Do not assume illness explains a missed period; consider a test if pregnancy is possible.",
      "hi": "माहवारी बदलने या बंद होने की जाँच में बीमारी की जानकारी काम आती है। हाल की बीमारी, दवाएँ और दूसरे लक्षण डॉक्टर को बताएँ। केवल बीमारी को कारण न मानें; गर्भ की संभावना हो तो जाँच करें।"
    },
    "sourceIds": [
      "amenorrhea",
      "pregnancyTest"
    ],
    "consult": true
  },
  {
    "id": "thyroid",
    "question": {
      "en": "Can thyroid problems affect my cycle?",
      "hi": "क्या थायरॉइड की समस्या से चक्र बदल सकता है?"
    },
    "keywords": {
      "en": [
        "thyroid",
        "hypothyroid",
        "hyperthyroid",
        "thyroxine"
      ],
      "hi": [
        "थायरॉइड",
        "थायराइड",
        "थाइराइड",
        "थाइरॉइड"
      ]
    },
    "answer": {
      "en": "Yes, overactive or underactive thyroid function can affect periods. The thyroid is a hormone-making gland in the neck. A clinician can assess symptoms and decide whether blood tests are needed; a period log cannot diagnose this.",
      "hi": "हाँ, थायरॉइड का ज़्यादा या कम काम करना माहवारी बदल सकता है। यह गर्दन की हार्मोन बनाने वाली ग्रंथि है। डॉक्टर लक्षण देखकर खून की जाँच की ज़रूरत तय कर सकते हैं; डायरी से निदान नहीं होता।"
    },
    "sourceIds": [
      "late",
      "thyroid",
      "amenorrhea"
    ],
    "consult": true
  },
  {
    "id": "travel",
    "question": {
      "en": "Can travel explain my late period?",
      "hi": "क्या यात्रा के बाद माहवारी देर से आ सकती है?"
    },
    "keywords": {
      "en": [
        "travel",
        "jet lag",
        "flight",
        "time zone",
        "journey"
      ],
      "hi": [
        "यात्रा",
        "सफ़र",
        "सफर",
        "उड़ान",
        "जेट लैग"
      ]
    },
    "answer": {
      "en": "Travel across time zones can disrupt sleep, and stress can affect period timing. That does not prove travel caused a late period. If pregnancy is possible, test as directed; ask a clinician about continuing changes.",
      "hi": "यात्रा में समय क्षेत्र बदलने से नींद बिगड़ सकती है और तनाव माहवारी के समय पर असर डाल सकता है। इससे यात्रा ही कारण है, यह तय नहीं होता। गर्भ की संभावना हो तो निर्देश अनुसार जाँच करें; बदलाव जारी रहे तो डॉक्टर से पूछें।"
    },
    "sourceIds": [
      "jetLag",
      "late",
      "pregnancyTest"
    ],
    "consult": true
  }
];
export default FAQ;
