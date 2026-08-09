/* ═══════════════════════════════════════
   典籍通 — 经典文献阅读
   ═══════════════════════════════════════ */

// ── 示例典籍数据（用户替换） ──
const library = [
  {
    id: 'lunyu',
    title: '论语',
    chapters: [
      {
        title: '学而第一 · 第一章',
        content: `学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？

有子曰："其为人也孝弟，而好犯上者，鲜矣；不好犯上，而好作乱者，未之有也。君子务本，本立而道生。孝弟也者，其为仁之本与！"

子曰："巧言令色，鲜矣仁。"

曾子曰："吾日三省吾身——为人谋而不忠乎？与朋友交而不信乎？传不习乎？"

子曰："道千乘之国，敬事而信，节用而爱人，使民以时。"

子曰："弟子入则孝，出则弟，谨而信，泛爱众，而亲仁。行有余力，则以学文。"

子夏曰："贤贤易色；事父母，能竭其力；事君，能致其身；与朋友交，言而有信。虽曰未学，吾必谓之学矣。"

子曰："君子，不重则不威；学则不固。主忠信。无友不如己者。过，则勿惮改。"

曾子曰："慎终追远，民德归厚矣。"

子禽问于子贡曰："夫子至于是邦也，必闻其政，求之与？抑与之与？"子贡曰："夫子温、良、恭、俭、让以得之。夫子之求之也，其诸异乎人之求之与！"`,
      },
      {
        title: '学而第一 · 第二章',
        content: `子曰："父在，观其志；父没，观其行；三年无改于父之道，可谓孝矣。"

有子曰："礼之用，和为贵。先王之道，斯为美。小大由之，有所不行；知和而和，不以礼节之，亦不可行也。"

有子曰："信近于义，言可复也。恭近于礼，远耻辱也。因不失其亲，亦可宗也。"

子曰："君子食无求饱，居无求安，敏于事而慎于言，就有道而正焉，可谓好学也已。"

子贡曰："贫而无谄，富而无骄，何如？"子曰："可也。未若贫而乐，富而好礼者也。"子贡曰："诗云：'如切如磋，如琢如磨'，其斯之谓与？"子曰："赐也，始可与言诗已矣，告诸往而知来者。"

子曰："不患人之不己知，患不知人也。"`,
      },
      {
        title: '为政第二 · 第一章',
        content: `子曰："为政以德，譬如北辰，居其所而众星共之。"

子曰："诗三百，一言以蔽之，曰：思无邪。"

子曰："导之以政，齐之以刑，民免而无耻；导之以德，齐之以礼，有耻且格。"

吾十有五而志于学，三十而立，四十而不惑，五十而知天命，六十而耳顺，七十而从心所欲，不逾矩。

孟懿子问孝。子曰："无违。"樊迟御，子告之曰："孟孙问孝于我，我对曰，无违。"樊迟曰："何谓也？"子曰："生，事之以礼；死，葬之以礼，祭之以礼。"

孟武伯问孝。子曰："父母唯其疾之忧。"

子游问孝。子曰："今之孝者，是谓能养。至于犬马皆能有养；不敬，何以别乎？"

子夏问孝。子曰："色难。有事，弟子服其劳；有酒食，先生馔，曾是以为孝乎？"`,
      },
    ],
  },
  {
    id: 'daodejing',
    title: '道德经',
    chapters: [
      {
        title: '第一章',
        content: `道可道，非常道；名可名，非常名。

无名，天地之始；有名，万物之母。

故常无欲，以观其妙；常有欲，以观其徼。

此两者同出而异名，同谓之玄。玄之又玄，众妙之门。`,
      },
      {
        title: '第二章',
        content: `天下皆知美之为美，斯恶已；皆知善之为善，斯不善已。

故有无相生，难易相成，长短相较，高下相倾，音声相和，前后相随。

是以圣人处无为之事，行不言之教。万物作焉而不辞，生而不有，为而不恃，功成而弗居。夫唯弗居，是以不去。`,
      },
      {
        title: '第三章',
        content: `不尚贤，使民不争；不贵难得之货，使民不为盗；不见可欲，使民心不乱。

是以圣人之治，虚其心，实其腹，弱其志，强其骨。常使民无知无欲，使夫智者不敢为也。

为无为，则无不治。`,
      },
    ],
  },
  {
    id: 'zhuangzi',
    title: '庄子',
    chapters: [
      {
        title: '内篇 · 逍遥游',
        content: `北冥有鱼，其名为鲲。鲲之大，不知其几千里也；化而为鸟，其名为鹏。鹏之背，不知其几千里也；怒而飞，其翼若垂天之云。是鸟也，海运则将徙于南冥。南冥者，天池也。

齐谐者，志怪者也。谐之言曰："鹏之徙于南冥也，水击三千里，抟扶摇而上者九万里，去以六月息者也。"野马也，尘埃也，生物之以息相吹也。

天之苍苍，其正色邪？其远而无所至极邪？其视下也，亦若是则已矣。

且夫水之积也不厚，则其负大舟也无力。覆杯水于坳堂之上，则芥为之舟；置杯焉则胶，水浅而舟大也。风之积也不厚，则其负大翼也无力。故九万里则风斯在下矣，而后乃今培风；背负青天而莫之夭阏者，而后乃今将图南。

蜩与学鸠笑之曰："我决起而飞，抢榆枋而止，时则不至，而控于地而已矣，奚以之九万里而南为？"适莽苍者，三餐而反，腹犹果然；适百里者，宿舂粮；适千里者，三月聚粮。之二虫又何知！

小知不及大知，小年不及大年。奚以知其然也？朝菌不知晦朔，蟪蛄不知春秋，此小年也。楚之南有冥灵者，以五百岁为春，五百岁为秋；上古有大椿者，以八千岁为春，八千岁为秋。而彭祖乃今以久特闻，众人匹之，不亦悲乎！`,
      },
      {
        title: '内篇 · 齐物论',
        content: `南郭子綦隐机而坐，仰天而嘘，荅焉似丧其耦。颜成子游立侍乎前，曰："何居乎？形固可使如槁木，而心固可使如死灰乎？今之隐机者，非昔之隐机者也。"子綦曰："偃，不亦善乎，而问之也！今者吾丧我，汝知之乎？女闻人籁而未闻地籁，女闻地籁而未闻天籁夫！"

子游曰："敢问方。"子綦曰："夫大块噫气，其名曰风。风生万窍，唯唯否否，而咸其自取，怒者其谁邪！"

大知闲闲，小知间间；大言炎炎，小言詹詹。其发若机栝，其司是非之谓也；其留如诅盟，其守胜之谓也；其杀如秋冬，以言其日消也；其溺之所为之，不可使复之也；其厌也如缄，以言其老洫也；近死之心，莫使复阳也。喜怒哀乐，虑叹变热，姚佚启态——乐出虚，蒸成菌。日夜相代乎前，而莫知其所萌。已乎，已乎！旦暮得此，其所由以生乎！`,
      },
    ],
  },
];

// ── 应用状态 ──
const state = {
  currentBook: null,
  currentChapter: 0,
  fontSize: 17,
  lineHeight: 1.9,
  theme: 'light',
  sidebarOpen: true,
};

// ── DOM 引用 ──
const $ = (sel) => document.querySelector(sel);
const bookListEl     = $('#bookList');
const readerTitleEl  = $('#readerTitle');
const welcomeEl      = $('#welcomeScreen');
const textContentEl  = $('#textContent');
const prevBtn        = $('#prevBtn');
const nextBtn        = $('#nextBtn');
const navInfoEl      = $('#navInfo');
const settingsPanel  = $('#settingsPanel');
const toggleBtn      = $('#toggleBtn');
const settingBtn     = $('#settingBtn');
const closeSettings  = $('#closeSettings');
const sidebarEl      = $('#sidebar');
const fontSizeLabel  = $('#fontSizeLabel');
const lhLabel        = $('#lhLabel');
const readerContent  = $('.reader-content');

// ── 初始化 ──
function init() {
  loadPreferences();
  renderBookList();
  applyTheme(state.theme);
  applyFontSize(state.fontSize);
  applyLineHeight(state.lineHeight);
  bindEvents();
}

// ── 渲染书籍列表 ──
function renderBookList() {
  bookListEl.innerHTML = library.map((book, i) => `
    <div class="book-item${state.currentBook === i ? ' active' : ''}" data-book="${i}">
      ${book.title}
      <span class="chapter-count">${book.chapters.length} 章</span>
    </div>
  `).join('');

  // 绑定点击事件
  bookListEl.querySelectorAll('.book-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.book);
      selectBook(idx);
    });
  });
}

// ── 选择书籍并打开第一章 ──
function selectBook(bookIndex) {
  state.currentBook = bookIndex;
  state.currentChapter = 0;
  updateSidebarActive();
  renderChapter();
}

function updateSidebarActive() {
  bookListEl.querySelectorAll('.book-item').forEach((el, i) => {
    el.classList.toggle('active', i === state.currentBook);
  });
}

// ── 渲染章节 ──
function renderChapter() {
  if (state.currentBook === null) return;
  const book = library[state.currentBook];
  const ch = book.chapters[state.currentChapter];

  readerTitleEl.textContent = `${book.title} · ${ch.title}`;
  welcomeEl.style.display = 'none';
  textContentEl.style.display = 'block';
  textContentEl.innerHTML = ch.content.split('\n\n').map(p => `<p>${escapeHtml(p)}</p>`).join('');

  navInfoEl.textContent = `第 ${state.currentChapter + 1} / ${book.chapters.length} 章`;
  prevBtn.disabled = state.currentChapter === 0;
  nextBtn.disabled = state.currentChapter === book.chapters.length - 1;

  // 滚动到顶部
  readerContent.scrollTop = 0;
}

// ── HTML 转义 ──
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── 上一章 ──
function goPrev() {
  if (state.currentChapter > 0) {
    state.currentChapter--;
    renderChapter();
  }
}

// ── 下一章 ──
function goNext() {
  if (state.currentBook !== null && state.currentChapter < library[state.currentBook].chapters.length - 1) {
    state.currentChapter++;
    renderChapter();
  }
}

// ── 侧栏切换 ──
function toggleSidebar() {
  state.sidebarOpen = !state.sidebarOpen;
  sidebarEl.classList.toggle('collapsed', !state.sidebarOpen);
}

// ── 主题 ──
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
  savePreferences();
}

// ── 字体大小 ──
function changeFontSize(delta) {
  state.fontSize = Math.max(14, Math.min(24, state.fontSize + delta));
  applyFontSize(state.fontSize);
  savePreferences();
}

function applyFontSize(size) {
  state.fontSize = size;
  textContentEl.style.fontSize = size + 'px';
  fontSizeLabel.textContent = size + 'px';
}

// ── 行间距 ──
function changeLineHeight(delta) {
  const steps = [1.5, 1.7, 1.9, 2.1, 2.3];
  let idx = steps.indexOf(state.lineHeight);
  if (idx === -1) idx = 2;
  idx = Math.max(0, Math.min(steps.length - 1, idx + delta));
  state.lineHeight = steps[idx];
  applyLineHeight(state.lineHeight);
  savePreferences();
}

function applyLineHeight(lh) {
  state.lineHeight = lh;
  textContentEl.style.lineHeight = lh;
  lhLabel.textContent = lh.toFixed(1);
}

// ── 设置面板 ──
function openSettings() { settingsPanel.classList.add('open'); }
function closeSettingsFn() { settingsPanel.classList.remove('open'); }

// ── 事件绑定 ──
function bindEvents() {
  // 导航按钮
  prevBtn.addEventListener('click', goPrev);
  nextBtn.addEventListener('click', goNext);

  // 侧栏开关
  toggleBtn.addEventListener('click', toggleSidebar);

  // 设置按钮
  settingBtn.addEventListener('click', openSettings);
  closeSettings.addEventListener('click', closeSettingsFn);
  settingsPanel.addEventListener('click', (e) => {
    if (e.target === settingsPanel) closeSettingsFn();
  });

  // 主题切换
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
  });

  // 字体大小
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const delta = btn.dataset.action === 'increase' ? 1 : -1;
      changeFontSize(delta);
    });
  });

  // 行间距
  document.querySelectorAll('.lh-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const delta = btn.dataset.action === 'increase' ? 1 : -1;
      changeLineHeight(delta);
    });
  });

  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goPrev(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goNext(); }
    if (e.key === 'Escape') closeSettingsFn();
  });

  // 触屏左右滑动翻页
  let touchStartX = 0;
  readerContent.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  readerContent.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 60) {
      if (dx > 0) goPrev(); else goNext();
    }
  }, { passive: true });
}

// ── 偏好存储 ──
function savePreferences() {
  try {
    localStorage.setItem('diantong-prefs', JSON.stringify({
      fontSize: state.fontSize,
      lineHeight: state.lineHeight,
      theme: state.theme,
    }));
  } catch(e) {}
}

function loadPreferences() {
  try {
    const prefs = JSON.parse(localStorage.getItem('diantong-prefs'));
    if (prefs) {
      state.fontSize = prefs.fontSize || 17;
      state.lineHeight = prefs.lineHeight || 1.9;
      state.theme = prefs.theme || 'light';
    }
  } catch(e) {}
}

// ── 启动 ──
init();
