# PKU Auto Elective

- Require a [ttshitu](http://www.ttshitu.com) account with enough money.

## Option One (with GUI)

Download from [releases](https://github.com/pku6/pae/releases).

## Option Two (without GUI)

- Require [git](https://git-scm.com).
- Require [nodejs](https://nodejs.org).

### Install

```
git clone https://github.com/pku6/pae.git
```

```
cd pae
```

```
npm ci
```

Fill in `config.json`. Fields about proxy can be ignored if you do not want to use a proxy. Actually, if your proxy has a high delay, you had better not use it.

### Start

```
npm start
```