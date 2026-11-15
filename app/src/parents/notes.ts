/**
 * Why each lesson is built the way it is, for parents: two sentences, the source, and how strong
 * the evidence is. Everything here comes from docs/research.md and says no more than it does.
 * The strength words are the ones the research file uses.
 */

export type Strength = 'strong' | 'promising' | 'mixed' | 'moderate' | 'guidance';

export const STRENGTH_WORDS: Record<Strength, string> = {
  strong: 'Strong evidence',
  promising: 'Promising: small or few studies',
  mixed: 'Mixed: studies disagree',
  moderate: 'Moderate evidence',
  guidance: 'Expert guidance, not a trial',
};

/** The studies and guides the app rests on. Addresses as in docs/research.md. */
export const SOURCES = {
  outhwaite: { label: 'Outhwaite et al. 2023, a review of maths apps for young children', url: 'https://pure.qub.ac.uk/en/publications/understanding-how-educational-maths-apps-can-enhance-learning-a-c/' },
  zhang: { label: 'Zhang & Okamoto 2017, building numbers from tens and ones', url: 'https://jnc.psychopen.eu/article/view/69' },
  laski: { label: 'Laski & Siegler 2014, number board games', url: 'https://www.cmu.edu/dietrich/psychology/cs/research-teaching/docs/2013LaskiSieglerNumberBoardGames.pdf' },
  ies: { label: 'IES practice guide 2021, helping children with early maths', url: 'https://ies.ed.gov/ncee/wwc/practiceguide/26' },
  mix: { label: 'Mix et al. 2023, early place value and later calculation', url: 'https://par.nsf.gov/servlets/purl/10506163' },
  frey: { label: 'Frey et al. 2024, finger-based training in first grade', url: 'https://aminer.org/pub/663959cf01d2a3fbfc9049fa/you-can-count-on-your-fingers-finger-based-intervention-improves-first-graders' },
  schild: { label: 'Schild et al. 2020, a finger training trial with no advantage', url: 'https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.00529/epub' },
  fyfe: { label: 'Fyfe, McNeil & Borjas 2015, from concrete to abstract in steps', url: '' },
  mcneil: { label: 'McNeil et al. 2025, how children best learn arithmetic facts', url: 'https://www.newswise.com/articles/science-explains-how-children-best-learn-math-and-yes-timed-practice-helps' },
  berkowitz: { label: 'Berkowitz et al. 2015, parents and children using a maths app together', url: 'https://news.uchicago.edu/article/2015/10/08/math-story-time-home-bolsters-achievement-school' },
  eef: { label: 'EEF guidance 2020, early maths', url: 'https://bso.bradford.gov.uk/userfiles/file/!Learning%20Support/EEF_Maths_EY_KS1_Summary_of_Recommendations.pdf' },
  rohrer: { label: 'Rohrer et al. 2020 and Taylor & Rohrer 2010, mixed practice', url: 'https://ies.ed.gov/use-work/awards/efficacy-study-interleaved-mathematics-practice' },
  groups: { label: 'Reviews of early multiplicative thinking; Carpenter et al. 1993', url: 'https://link.springer.com/10.1007/s13394-022-00413-1' },
  fractions: { label: 'IES fractions practice guide, Siegler et al. 2010', url: 'https://ies.ed.gov/ncee/wwc/PracticeGuide/15' },
  trajectories: { label: 'Clements & Sarama, learning trajectories, review 2024', url: 'https://dreme.stanford.edu/publication/systematic-review-of-learning-trajectories-in-early-mathematics' },
  onebillion: { label: 'onebillion trial, a structured maths app used daily', url: 'https://onebillion.org/impact/evidence' },
  klinkenberg: { label: 'Klinkenberg et al. 2011, Math Garden', url: 'https://dare.uva.nl/id/de65bb65-d198-4dbc-ac7b-bc25ca23e627' },
  sailer: { label: 'Sailer & Homner 2020, a review of gamification', url: 'https://link.springer.com/article/10.1007/s10648-019-09498-w' },
  deci: { label: 'Deci, Koestner & Ryan 1999, rewards and motivation', url: '' },
  control: { label: 'Reviews of learner control; Kostons et al. 2012', url: 'https://springerlink.bibliotecabuap.elogim.com/doi/10.1007/s11409-017-9173-2' },
  patall: { label: 'Patall, Cooper & Robinson 2008, the effect of choice', url: 'https://pubmed.ncbi.nlm.nih.gov/18298272/' },
  gunderson: { label: 'Gunderson et al. 2013 and 2018, praise for effort', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5826820' },
  eng: { label: 'Eng, Godwin & Fisher 2020, pictures that distract', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7522290/' },
  nielsen: { label: 'Nielsen Norman Group, designing for children’s hands', url: 'https://www.nngroup.com/articles/children-ux-physical-development/' },
} as const;
export type SourceId = keyof typeof SOURCES;

export interface Note {
  /** Two sentences: why the lesson is built this way. */
  why: string;
  source: SourceId;
  strength: Strength;
}

const n = (why: string, source: SourceId, strength: Strength): Note => ({ why, source, strength });

export const NOTES: Record<string, Note> = {
  's1-count': n('She touches each thing once and says one number for each, then sees the same things moved about. Teaching that follows the order in which counting develops has worked better than other approaches in several large studies.', 'trajectories', 'strong'),
  's1-see': n('Fingers, towers and the ten frame all show five as one piece, so she learns to see "five and some more" without counting. Finger patterns helped first graders in one trial, but another trial found no advantage.', 'frey', 'mixed'),
  's1-zero': n('Zero is shown as the empty plate after everything has been taken, so it is a number with a meaning and not just a sign. This follows the usual order in which children come to understand counting.', 'trajectories', 'strong'),
  's1-estimate': n('She guesses first and then checks by counting or packing in tens, so a guess is always tested against the real amount. Hands-on material and pictures are recommended for building this kind of number sense.', 'eef', 'guidance'),
  's1-names': n('She hears, reads and picks the number names again and again, always next to the blocks. Reading and writing number names was one of the best early signs of later success with bigger sums.', 'mix', 'strong'),
  's1-teens': n('Every teen number is built as one ten and some ones, because the English names hide that. Children who built numbers from exact tens and ones placed numbers more accurately afterwards, in a small study.', 'zhang', 'promising'),
  's1-compare': n('Two numbers are compared on a number line, where the bigger one is always further along. Number lines are recommended as a core tool for early maths.', 'ies', 'strong'),
  's1-ordinal': n('First, second and third are tied to places in a row she can see and point at. This follows the usual order in which children learn to use numbers for position.', 'trajectories', 'strong'),
  's1-pattern': n('She says what comes next in a pattern and then sees it continue. Lessons that follow the known order of development did better than other approaches in several large studies.', 'trajectories', 'strong'),
  's1-skip': n('She hops along the number line in ones, twos and tens and says where she lands. Counting on from where you stand taught far more than starting from one each time.', 'laski', 'strong'),
  's1-oddeven': n('Things are paired up: if one is left over the number is odd. Seeing it with real pairs comes before the rule, as the guidance on using material and pictures recommends.', 'eef', 'guidance'),
  's1-add': n('Adding starts with two groups she can see being put together, then a drawing, then only the numbers. Moving from real things to numbers in steps helped children use what they learnt in new problems, though not in every study.', 'fyfe', 'promising'),
  's1-sub': n('Taking away starts with things she sees removed, then a drawing, then only the numbers. Moving from real things to numbers in steps helped children use what they learnt, though not in every study.', 'fyfe', 'promising'),
  's1-ten': n('The pairs that make ten are learnt on fingers and the ten frame first, then from memory, because ten is the stepping stone for all later sums. Using ten as a reference point and practising recall are both well supported.', 'mcneil', 'strong'),
  's1-doubles': n('Doubles are shown as two equal rows, so she sees the pattern before she remembers it. Recalling facts she already understands is what makes them fast later.', 'mcneil', 'strong'),
  's1-calc20': n('Sums to 20 are worked through ten: fill the ten, then add the rest. Using ten as a reference point is one of the best supported ways to become fluent.', 'mcneil', 'strong'),
  's1-half': n('Halves start with sharing fairly between two, first a set of things and then one whole thing. That is the starting point the practice guide on fractions recommends.', 'fractions', 'guidance'),
  's1-money': n('She learns to recognise the real coins and notes she sees at home. Real, familiar material is recommended for building understanding.', 'eef', 'guidance'),
  's2-count': n('A heap is packed into tens before it is counted, so she sees why we write numbers the way we do. Children who built numbers from exact tens and ones placed numbers more accurately afterwards, in a small study.', 'zhang', 'promising'),
  's2-place': n('The same number is shown as blocks, as tens and ones, on the number line and as a name, until the tens digit means "that many tens" to her. Knowing how many tens a number has was one of the best early signs of later success with bigger sums.', 'mix', 'strong'),
  's2-names': n('She matches spoken and written number names to numbers up to 100. Reading and writing number names was one of the best early signs of later success with bigger sums.', 'mix', 'strong'),
  's2-regroup': n('She builds a number from tens and ones and walks it along the number line, ten steps at a time. Children who did this with exact tens and ones placed numbers more accurately afterwards, in a small study.', 'zhang', 'promising'),
  's2-see': n('New arrangements of up to ten things are seen at a glance, by looking for the five. Finger and pattern training helped first graders in one trial, but another trial found no advantage.', 'frey', 'mixed'),
  's2-estimate': n('She guesses how many are in a heap and then checks by packing it in tens. Hands-on material and pictures are recommended for building this kind of number sense.', 'eef', 'guidance'),
  's2-compare': n('Two numbers up to 100 are compared by their tens first, then on the number line. Number lines are recommended as a core tool for early maths.', 'ies', 'strong'),
  's2-ordinal': n('Position words beyond tenth are tied to places in a row she can see. This follows the usual order in which children learn to use numbers for position.', 'trajectories', 'strong'),
  's2-round': n('She finds which ten a number is nearer to by looking at it on the number line. Number lines are recommended as a core tool for early maths.', 'ies', 'strong'),
  's2-skip': n('She hops in twos, fives and tens from any number and says where she lands. Counting on from where you stand taught far more than starting from one each time.', 'laski', 'strong'),
  's2-oddeven': n('Odd and even are read from the ones digit, after she has seen with pairs why that works. Seeing it with real things first is what the guidance on material and pictures recommends.', 'eef', 'guidance'),
  's2-sequence': n('She finds the rule of a number pattern and continues it on the hundred square. Lessons that follow the known order of development did better than other approaches in several large studies.', 'trajectories', 'strong'),
  's2-bonds': n('The pairs that make 20 and the tens that make 100 are built from the pairs that make ten she already knows. Using ten as a reference point and practising recall are both well supported.', 'mcneil', 'strong'),
  's2-inverse': n('A box hides one number in a sum, and a bar picture shows the whole and its parts, so she sees that adding and taking away undo each other. Pictures that show how a problem is put together are recommended in the practice guide.', 'ies', 'strong'),
  's2-calc': n('Tens are added to tens and ones to ones, first with blocks, then with a sketch, then in her head. Moving from real things to numbers in steps helped children use what they learnt, though not in every study.', 'fyfe', 'promising'),
  's2-times': n('Multiplying starts as equal groups on plates, then rows and columns, tied to the hops of two, five and ten she knows. Equal groups are where children’s own ideas of multiplying begin.', 'groups', 'guidance'),
  's2-tables': n('The 1, 2, 5 and 10 times tables are read from rows and columns before they are recalled. Recalling facts she already understands is what makes them fast later.', 'mcneil', 'strong'),
  's2-divide': n('Dividing starts as dealing things out fairly, then as making groups of a given size. Sharing is where children’s own ideas of dividing begin.', 'groups', 'guidance'),
  's2-quarter': n('Quarters come from cutting and sharing fairly in four, and then sit on a bar from 0 to 1 so she sees them as numbers with a size. This is the order the practice guide on fractions recommends.', 'fractions', 'guidance'),
  's2-money': n('Amounts are made from real coins and notes and compared, which uses tens and ones in a setting she knows. Real, familiar material is recommended for building understanding.', 'eef', 'guidance'),
  'x-fill': n('To add across a ten she fills the ten first and then adds what is left, on two ten frames. Using ten as a reference point is one of the best supported ways to become fluent.', 'mcneil', 'strong'),
  'x-break': n('To take away across a ten she goes down to the ten first, or breaks a ten into ones. Using ten as a reference point is one of the best supported ways to become fluent.', 'mcneil', 'strong'),
  'x-line': n('She places numbers on a nearly empty line by thinking in tens and then ones. Children who built numbers from exact tens and ones placed numbers more accurately afterwards, in a small study.', 'zhang', 'promising'),
};
