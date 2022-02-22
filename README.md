# PKU Auto Elective

- Require a [ttshitu](http://www.ttshitu.com) account with enough money.

- 不支持翻页, 需要待选课程在第一页.

- 不支持双学位.

## Option One (with GUI)

在 [releases](https://github.com/pku6/pae/releases) 中下载一个合适的 zip 压缩包, 然后解压, 然后找到可执行文件 (windows 平台下是 pae.exe) 点击一下, 然后就有图形界面了, 之后的操作非常简单无需赘述.

如果要同时刷新多门课, 可以通过把整个文件夹复制多份来实现, 或是使用下面的命令行版本.

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