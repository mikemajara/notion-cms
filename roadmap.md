# Roadmap

- [x] allow multiple databases to be introspected: this would allow having one single huge file with all types and methods augmenting notionCMS
- [x] Implement sort
- [ ] Implement support for all blocks. Some are pending...
  - [x] Simple table: not supported
  - [ ] Formula: Can't parse based in simple layer based on type. Should be able to.
  - [x] Images: not sure if supported. Need to implement proper cache handling and availability from bucket. WIP
  - [x] Code: language attribute pass as parameter.
- [ ] Enhance the generator: The generate command should include an --env option which when present, should read from .env by default or from the file provided as parameter to --env. Then the generator will use to generate the types file (1) the ENV variables that were passed to the generator if --env was used (2) the plain ID strings if no --env was passed.

# Tasks

- [x] We're missing the native id from each record in the type generation: we need to add that.
- [x] When building a query appending filter... sort... .single(), the types don't match correctly to a single ResourceRecord.

---

## Query

- [ ] Support explicit AND/OR filters
- [ ] Support basic pagination through a caching system in the background.
- [ ]

## Properties

- [ ] Support for formula fields: Formula fields are supported. Notion doesn't hint the type of the formula in the API, but does return the values fine. So the user must set the type in the api, and they shall be able to query them normally.
- [ ] ...

## Converters

- [ ] Add config for blocksToMarkdown to allow plugins and configure experimental features like underlining or HTML embeded in markdown.

## CLI

- [ ] When formula fields are parsed, Notion gives no information about the type of the formula, unless you query 1 page. This is a limitation cos (1) if there are no pages in the database, we can't really figure out the type of the formula, and (2) if we don't check the pages we won't know. We basically have 2 options here
  - [ ] A. We prompt the user during the generation so they edit the formula fields as they should know
  - [ ] B. We try to scan the 1st record in a database, and set the value to that record.
