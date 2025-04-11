<!-- @format -->

# firebase-pair-example

1. **Clone the repository**

   ```bash
   git clone https://github.com/hakisolos/firebase-pair-example.git
   cd pair-example
   ```

   ##ALSO ADD UR FREBASE SERVCE ACCOUNT JSON DONT FORGET

2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Run the script**

   ```bash
   npm start
   ```

4. **Pairing Usage**

   ```
   http://localhost:3000/pair?code=+6969696969
   ```

5. **connection example**
   ```
   const { saveCreds } = require('./saveCreds');
   ```

(async () => {
try {
await saveCreds("SESSION-IDabc123xyz");
} catch (err) {
console.error("Error saving creds:", err.message);
}
})();

    ```

###### IDEA FROM https://github.com/iron-m4n/pair-example

## NIKKA TECH INC
