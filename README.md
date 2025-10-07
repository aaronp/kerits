# kerits

![Kerits](./ui/public/kerits.jpg) Kerits is "KERI+TS" - a purely functional implementation of KERI in typescript.


You can run this code [here](https://aaronp.github.io/kerits/) to:

1. create entities (users)
2. define schemas
3. and issue, accept and verify credentials for those data schemas.


All the identities are stored locally in your browser, but you perfrom interoperability with basic 'copy/paste' functionality,
leaving you to build upon this implementation with whatever workflows, messaging, etc you'd like.

## Testing

Run the complete test suite (75 compatibility tests + 132 unit tests):
```bash
make test
```

All test cases are self-contained in `./test-cases` and verified against the Python keripy implementation.

## Building

Running the UI locally:
```bash
cd ui && bun run dev
```

Building for production:
```bash
bash build-for-pages.sh
```

Running the CLI locally:
```bash
cd cli && bun run dev
```