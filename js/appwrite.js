const { Client, Account, Databases, Storage } = Appwrite;

const client = new Client()
    .setEndpoint("https://nyc.cloud.appwrite.io/v1")
    .setProject("69a0c93200084defefe1");

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

window.client = client;
window.account = account;
window.databases = databases;
window.storage = storage;

