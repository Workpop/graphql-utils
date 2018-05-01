import faker from 'faker';

function mockSkills(count = 3) {
  const skills = [];
  for (let i = 0; i < count; i += 1) {
    skills.push(faker.random.word());
  }
  return skills;
}

export default {
  // RESUME
  skills() {
    return mockSkills();
  },
  // ADDRESSES
  zipCode: () => {
    return faker.address.zipCode();
  },
  city: () => {
    return faker.address.city();
  },
  streetName: () => {
    return faker.address.streetName();
  },
  streetAddress() {
    return faker.address.streetAddress();
  },
  secondaryAddress: () => {
    return faker.address.secondaryAddress();
  },
  county: () => {
    return faker.address.county();
  },
  country: () => {
    return faker.address.country();
  },
  countryCode: () => {
    return faker.address.countryCode();
  },
  state: () => {
    return faker.address.state();
  },
  stateAbbr: () => {
    return faker.address.stateAbbr();
  },
  latitude: () => {
    return faker.address.latitude();
  },
  longitude: () => {
    return faker.address.longitude();
  },
  // Company
  companyName: () => {
    return faker.company.companyName();
  },
  companyCatchPhrase: () => {
    return faker.company.catchPhrase();
  },
  companyBs: () => {
    return faker.company.bs();
  },
  // Date
  pastDate() {
    const date = faker.date.past();
    return date;
  },
  futureDate() {
    const date = faker.date.future();
    return date;
  },
  recentDate() {
    const date = faker.date.recent();
    return date;
  },
  // Finance
  financeAccountName: () => {
    return faker.finance.accountName();
  },
  financeTransactionType: () => {
    return faker.finance.transactionType();
  },
  currencyCode: () => {
    return faker.finance.currencyCode();
  },
  currencyName: () => {
    return faker.finance.currencyName();
  },
  currencySymbol: () => {
    return faker.finance.currencySymbol();
  },
  bitcoinAddress: () => {
    return faker.finance.bitcoinAddress();
  },
  internationalBankAccountNumber: () => {
    return faker.finance.iban();
  },
  bankIdentifierCode: () => {
    return faker.finance.bic();
  },
  // Commerce
  colorName: () => {
    return faker.commerce.color();
  },
  productCategory: () => {
    return faker.commerce.department();
  },
  productName: () => {
    return faker.commerce.productName();
  },
  productMaterial: () => {
    return faker.commerce.productMaterial();
  },
  product: () => {
    return faker.commerce.product();
  },
  // Internet
  avatarUrl: () => {
    return faker.internet.avatar();
  },
  email() {
    return faker.internet.email();
  },

  url: () => {
    return faker.internet.url();
  },
  // Lorem
  paragraphs() {
    return faker.lorem.paragraphs();
  },
  sentences() {
    return faker.lorem.sentences();
  },

  // Name
  firstName: () => {
    return faker.name.firstName();
  },
  lastName: () => {
    return faker.name.lastName();
  },
  fullName: () => {
    return faker.name.findName();
  },
  jobTitle: () => {
    return faker.name.jobTitle();
  },

  // Phone
  phoneNumber: () => {
    return faker.phone.phoneNumber();
  },

  // Random
  uuid: () => {
    return faker.random.uuid();
  },
  word: () => {
    return faker.random.word();
  },
  words: () => {
    return faker.random.words();
  },
  locale: () => {
    return faker.random.locale();
  },
};
