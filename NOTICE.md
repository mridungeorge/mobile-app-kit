# Third-party notices

The skills, scripts, native starters and docs in this repository are MIT licensed — see
[`LICENSE`](LICENSE). The material below is third-party and carries its own licence.

## React Bits components

`motion-demo/src/components/reactbits/` — `AnimatedContent`, `ClickSpark`, `Magnet`,
`SplitText`, `StarBorder` (plus `StarBorder.css`).

- Source: [React Bits](https://github.com/DavidHDev/react-bits)
- Licence: **MIT + Commons Clause v1.0**, © 2026 David Haz

The Commons Clause restricts resale of the components themselves, as shipped with them:

> Do not resell the components themselves; using them inside an application is permitted
> under the licence.

They are vendored here only to demonstrate the motion skill against real components. In a
project of your own, install fresh copies instead of copying these files:

```bash
npx shadcn@latest add @react-bits/<Component>-TS-TW
```

The same notice is kept next to the code at
[`motion-demo/src/components/reactbits/NOTICE.md`](motion-demo/src/components/reactbits/NOTICE.md).

## Inter font

`promo/fonts/Inter-latin.woff2` — Inter, by Rasmus Andersson.

- Source: [rsms/inter](https://github.com/rsms/inter)
- Licence: **SIL Open Font License 1.1** — <https://openfontlicense.org>

The font is inlined into the promo renders in `docs/` (banner, poster, GIF, video frames).
It is not shipped inside generated apps; the native starters use platform system fonts.
