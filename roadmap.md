# Roadmap

- [x] allow multiple databases to be introspected: this would allow having one single huge file with all types and methods augmenting notionCMS
- [x] Implement sort
- [ ] Implement support for all blocks. Some are pending...
  - [x] Simple table: not supported
  - [ ] Formula: Can't parse based in simple layer based on type. Should be able to.
  - [x] Images: not sure if supported. Need to implement proper cache handling and availability from bucket. WIP
  - [ ] Code: language attribute pass as parameter.

# Tasks

- [x] We're missing the native id from each record in the type generation: we need to add that.
- [x] When building a query appending filter... sort... .single(), the types don't match correctly to a single ResourceRecord.
