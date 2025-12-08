# Setup Guide
## Summary:
To run our app locally, you will need to add `.env` and `application.properties` files to your local repository. These files are untracked by Git to keep our secret keys private. The secret keys for JWT, OpenAI, Groq, and Gmail Servers are provided in our shared Google Drive (we will submit the link along with the code). 

Follow the steps below to get set up.

Please note: The JWT secret key does not need to be a specific value, however it *must be the same value* used across all microservices that use it.

### 1. Create the `.env` and `.application.properties` files
Run the create-env-files script to automatically generate these files & a JWT secret key:

Git Bash
```
.devcontainer/create-env-files.sh
```
Mac
```sh
sh .devcontainer/create-env-files.sh
```
After running the script, confirm that the files exist and the JWT secret key value is identical across services.

If you're unable to run the script, create the files manually:
- In the **activity-tracking**, **ai-speech-parser**, **analytics** and **graphql-gateway** directories there is an `.env.example` file.
- In each directory, copy the contents of the `.env.example` into a new `.env` file.
- In **`authservice/src/main/resources`**, copy the contents of `application.properties.example` into a new `application.properties` file.


### 2. Add the secrets/api keys
All keys can be found in the text files in our shared **Google Drive folder** `04 Project Keys`.
Check each of your newly created files and fill in the placeholder text with the real values:

**`activity-tracking/.env`**
- If you ran the script, you should already have a JWT secret key. If not, replace `JWT_KEY_HERE` with a real value (use the example from 'jwt_secret_key.txt')

**`ai-speech-parser/.env`**
- Groq API Key - replace `API_KEY_HERE` with the real value from 'env for ai-speech-parser microservice.txt'
- This service does not require any other secrets

**`analytics/.env`** 
- If you ran the script, you should already have a JWT secret key. If not, replace `JWT_KEY_HERE` with a real value (use the example from 'jwt_secret_key.txt')
- OpenAI Key - replace `your_openai_key_here` with the real value from 'ai-chatbot openai-key.txt'

**`authservice/src/main/resources/application.properties`**
- If you ran the script, you should already have a JWT secret key. If not, replace `JWT_KEY_HERE` with a real value (use the example from 'jwt_secret_key.txt')
- Email Server Settings:
    - If using the real email servers, replace `USERNAME` and `PASSWORD` with the values from 'mail_username_password.txt'
    - If you don't wish to receive real emails, you can instead use MailHog by commenting out the lines below `# Real Email Server Settings`, and uncommenting the lines below `# MailHog Server Settings`, and leave the username and password blank.
    - If you use MailHog, you can sign up to our app with any fake email address and the emails will go to the MailHog UI at `localhost:8025`.

**`graphql-gateway/.env`** 
- If you ran the script, you should already have a JWT secret key. If not, replace `JWT_KEY_HERE` with a real value (use the example from 'jwt_secret_key.txt')

Save all files before proceeding to the next step.

### 3. Build & run the app in Docker
```sh
docker-compose up --build
```
**Please Note:** The build takes about *15 minutes* to complete. This is due to the long build time of the ai-speech-parser.

You should now be able to access the app on localhost.

## Quick reference & Troubleshooting
- Check you have all the required env files & secret keys:
  - activity-tracking: `activity-tracking/.env` (JWT_SECRET_KEY)
  - analytics: `analytics/.env` (JWT_SECRET_KEY, OPENAI_API_KEY)
  - ai-speech-parser: `ai-speech-parser/.env` (GROQ_API_KEY)
  - graphql-gateway: `graphql-gateway/.env` (JWT_SECRET_KEY)
  - authservice: `authservice/src/main/resources/application.properties` (jwt.secret.key, spring.mail.username & spring.mail.password if using real email servers)
- Check that the JWT Secret key is identical across all services


## Signing up on the app
Our app asks for an email address when signing up and will email you a verification link which you must click on to be able to log in.
If you're using the real email servers and don't want to use your personal email address, you could use [TempMail](https://temp-mail.org/en/) for a temporary, valid email address.
Otherwise, you can use MailHog instead which will allow you to use any fake email address and the email will be sent to the MailHog UI at `localhost:8025`. 
MailHog is included in the docker-compose and will be started up with the rest of the app.