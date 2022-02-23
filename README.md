# PKU Auto Elective

- 需要注册一个 [ttshitu](http://www.ttshitu.com) 账户并进行充值.

- 需要待选课程在第一页.

## Option One (图形界面版)

1. 在 [releases](https://github.com/pku6/pae/releases) 中下载一个合适的 zip 压缩包. (以 pae-darwin 开头的是 Mac 平台的.)

2. 然后

    - Windows 平台: 解压 zip 压缩包, 然后找到 pae.exe 并点击.

    - Mac 平台: 把 pae.app 移到 Applications 中, 然后点击它.

3. 然后就有图形界面了, 之后的操作非常简单无需赘述.

## Option Two (命令行版)

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