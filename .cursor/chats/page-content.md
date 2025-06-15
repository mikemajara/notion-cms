We now need to focus on pulling the content from any given notion page. This means all the child blocks. There might be sth implemented already so please check the code. Also review the @ Notion official api.

The main goal here, as with the rest of the API is

1. to add simple support to retrieve a whole page and pass it to markdown
2. add more advanced features where users can retrieve synced blocks, toggles etc.

Theres two key aspects we need to think about here:
a. We need to figure out where the balance is and what sort of blocks would belong in the simple API vs which
b. We need to figure how we'll be importing and structuring child blocks that are simple in nature (like nested lists, which in notion are complex nested blocks)

Your task rn is to

1. review what exists already ni terms of parsing the content
2. Propose an implementation for our application focusing on our goal mentioned above

Ask for any information you are missing in order to correctly execute on the task you are given. :planPlan the steps of your task before executing it, and wait for my green-light
