# Atom CSS Color Viewer

Simple CSS color viewer for Atom, **automatically enabled**.

Thanks [Adem İlter][1] and [interacthings][2] for the idea :)

Install:
```bash
apm install webbox-color
```

It shows the colors of the CSS colors in all
the color formats **HEX, Short HEX, rgb and rgba**

## Background Filling

![Atom Color Fill](https://dl.dropboxusercontent.com/u/20947008/webbox/atom/atom-color-3.png)

## Show on Line End

To use line endings, disable filling:

![Atom Color Setting](https://dl.dropboxusercontent.com/u/20947008/webbox/atom/atom-color-settings.png)

![Atom Color Line](https://dl.dropboxusercontent.com/u/20947008/webbox/atom/atom-color-5.png)

## Embedded CSS

Also you can use in HTML or **embedded CSS**

![Atom Color Embedded](https://dl.dropboxusercontent.com/u/20947008/webbox/atom/atom-color-4.png)

## Customization

You can edit your `styles.less` to customize colors.

```less
// ~/.atom/styles.less
.editor {
  .color-box {

    // Customize Line Endings
    &.on-line-end {
      border-radius: 2px 5px;
      margin-left: 1px;
      border: 1px solid #fff;
      background-image: -webkit-linear-gradient(
        top,
        transparent 0%,
        rgb(200, 200, 200) 100%);
    }

    // Customize Background Mode
    &.on-background {
      border-radius: 0;
      text-shadow: none;
      box-shadow: 0 0 5px 2px #fff;
      border: 1px solid #000;
    }
  }
}
```

When you apply these settings, you'll see something like that:

![Atom Customize 1](https://dl.dropboxusercontent.com/u/20947008/webbox/atom/atom-color-6.png)

![Atom Customize 2](https://dl.dropboxusercontent.com/u/20947008/webbox/atom/atom-color-7.png)


## Change Log

### 2015-03-04

* Atom API deprication fixed by [gmoore-sjcorg](https://github.com/gmoore-sjcorg)

### 2015-01-04

* less/sass support added (fixed issue #5, thanx 2 [khuongduybui](https://github.com/khuongduybui))
* package name changed to: webbox-color

[1]: https://twitter.com/ademilter
[2]: http://interacthings.com/
