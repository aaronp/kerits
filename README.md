# kerits

![Kerits](./ui/public/kerits.jpg) Kerits is "KERI+TS" - a purely functional implementation of KERI in typescript.


You can run this code [here](https://aaronp.github.io/kerits/) to:

1. create entities (users)
2. define schemas
3. and issue, accept and verify credentials for those data schemas.


All the identities are stored locally in your browser, but you perfrom interoperability with basic 'copy/paste' functionality,
leaving you to build upon this implementation with whatever workflows, messaging, etc you'd like.

## Building

```bash
make dev
```

Running the UI locally:
```bash
cd ui &&  make dev
```


Running the CLI locally:
```bash
cd cli &&  make dev
```