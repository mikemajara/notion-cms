This turborepo was originally created with to simplify the notion-cms api. There are a few cases we want to cover.

While developing we noticed that the functionality and specially the documentation has been bloated, and we need to prune it to simplify as much as possible and help users digest this. From the top of my head these are the main features we want to ship, and talk about in the docs:

- simplified API: why and how to use it
- advanced API: why and how to use it
- raw API: why and when to use

- generating types and autocomplete
- querying
- filtering
- sorting

- content parsing
- to markdown
- to html
- block support

- file manager
- caching: direct, local, remote.

I would like you to analyze the content I walked through, check the current documentation for the `notion-cms` library which is in @packages/notion-cms/docs

I think there might be some content that relates to the inner workings of the library that is not relevant for users. Any other functionality that has been added on top of the one above I need to review.

Share your thoughts and put together a plan to:

- Review and update the documentation
- Review and update the codebase
