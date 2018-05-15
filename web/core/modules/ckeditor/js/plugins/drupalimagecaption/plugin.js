/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function (CKEDITOR) {
  CKEDITOR.plugins.add('drupalimagecaption', {
    requires: 'drupalimage',

    beforeInit: function beforeInit(editor) {
      editor.lang.image2.captionPlaceholder = '';

      var placeholderText = editor.config.drupalImageCaption_captionPlaceholderText;

      editor.on('widgetDefinition', function (event) {
        var widgetDefinition = event.data;
        if (widgetDefinition.name !== 'image') {
          return;
        }

        var captionFilterEnabled = editor.config.drupalImageCaption_captionFilterEnabled;
        var alignFilterEnabled = editor.config.drupalImageCaption_alignFilterEnabled;

        CKEDITOR.tools.extend(widgetDefinition.features, {
          caption: {
            requiredContent: 'img[data-caption]'
          },
          align: {
            requiredContent: 'img[data-align]'
          }
        }, true);

        var requiredContent = widgetDefinition.requiredContent.getDefinition();
        requiredContent.attributes['data-align'] = '';
        requiredContent.attributes['data-caption'] = '';
        widgetDefinition.requiredContent = new CKEDITOR.style(requiredContent);
        widgetDefinition.allowedContent.img.attributes['!data-align'] = true;
        widgetDefinition.allowedContent.img.attributes['!data-caption'] = true;

        widgetDefinition.editables.caption.allowedContent = 'a[!href]; em strong cite code br';

        var originalDowncast = widgetDefinition.downcast;
        widgetDefinition.downcast = function (element) {
          var img = findElementByName(element, 'img');
          originalDowncast.call(this, img);

          var caption = this.editables.caption;
          var captionHtml = caption && caption.getData();
          var attrs = img.attributes;

          if (captionFilterEnabled) {
            if (captionHtml) {
              attrs['data-caption'] = captionHtml;
            }
          }
          if (alignFilterEnabled) {
            if (this.data.align !== 'none') {
              attrs['data-align'] = this.data.align;
            }
          }

          if (img.parent.name === 'a') {
            return img.parent;
          }

          return img;
        };

        var originalUpcast = widgetDefinition.upcast;
        widgetDefinition.upcast = function (element, data) {
          if (element.name !== 'img') {
            return;
          } else if (element.attributes['data-cke-realelement']) {
              return;
            }

          element = originalUpcast.call(this, element, data);
          var attrs = element.attributes;

          if (element.parent.name === 'a') {
            element = element.parent;
          }

          var retElement = element;
          var caption = void 0;

          if (captionFilterEnabled) {
            caption = attrs['data-caption'];
            delete attrs['data-caption'];
          }
          if (alignFilterEnabled) {
            data.align = attrs['data-align'];
            delete attrs['data-align'];
          }
          data['data-entity-type'] = attrs['data-entity-type'];
          delete attrs['data-entity-type'];
          data['data-entity-uuid'] = attrs['data-entity-uuid'];
          delete attrs['data-entity-uuid'];

          if (captionFilterEnabled) {
            if (element.parent.name === 'p' && caption) {
              var index = element.getIndex();
              var splitBefore = index > 0;
              var splitAfter = index + 1 < element.parent.children.length;

              if (splitBefore) {
                element.parent.split(index);
              }
              index = element.getIndex();
              if (splitAfter) {
                element.parent.split(index + 1);
              }

              element.parent.replaceWith(element);
              retElement = element;
            }

            if (caption) {
              var figure = new CKEDITOR.htmlParser.element('figure');
              caption = new CKEDITOR.htmlParser.fragment.fromHtml(caption, 'figcaption');

              caption.attributes['data-placeholder'] = placeholderText;

              element.replaceWith(figure);
              figure.add(element);
              figure.add(caption);
              figure.attributes.class = editor.config.image2_captionedClass;
              retElement = figure;
            }
          }

          if (alignFilterEnabled) {
            if (data.align === 'center' && (!captionFilterEnabled || !caption)) {
              var p = new CKEDITOR.htmlParser.element('p');
              element.replaceWith(p);
              p.add(element);

              p.addClass(editor.config.image2_alignClasses[1]);
              retElement = p;
            }
          }

          return retElement;
        };

        CKEDITOR.tools.extend(widgetDefinition._mapDataToDialog, {
          align: 'data-align',
          'data-caption': 'data-caption',
          hasCaption: 'hasCaption'
        });

        var originalCreateDialogSaveCallback = widgetDefinition._createDialogSaveCallback;
        widgetDefinition._createDialogSaveCallback = function (editor, widget) {
          var saveCallback = originalCreateDialogSaveCallback.call(this, editor, widget);

          return function (dialogReturnValues) {
            dialogReturnValues.attributes.hasCaption = !!dialogReturnValues.attributes.hasCaption;

            var actualWidget = saveCallback(dialogReturnValues);

            if (dialogReturnValues.attributes.hasCaption) {
              actualWidget.editables.caption.setAttribute('data-placeholder', placeholderText);

              var captionElement = actualWidget.editables.caption.$;
              if (captionElement.childNodes.length === 1 && captionElement.childNodes.item(0).nodeName === 'BR') {
                captionElement.removeChild(captionElement.childNodes.item(0));
              }
            }
          };
        };
      }, null, null, 20);
    },
    afterInit: function afterInit(editor) {
      var disableButtonIfOnWidget = function disableButtonIfOnWidget(evt) {
        var widget = editor.widgets.focused;
        if (widget && widget.name === 'image') {
          this.setState(CKEDITOR.TRISTATE_DISABLED);
          evt.cancel();
        }
      };

      if (editor.plugins.justify && !editor.config.drupalImageCaption_alignFilterEnabled) {
        var cmd = void 0;
        var commands = ['justifyleft', 'justifycenter', 'justifyright', 'justifyblock'];
        for (var n = 0; n < commands.length; n++) {
          cmd = editor.getCommand(commands[n]);
          cmd.contextSensitive = 1;
          cmd.on('refresh', disableButtonIfOnWidget, null, null, 4);
        }
      }
    }
  });

  function findElementByName(element, name) {
    if (element.name === name) {
      return element;
    }

    var found = null;
    element.forEach(function (el) {
      if (el.name === name) {
        found = el;

        return false;
      }
    }, CKEDITOR.NODE_ELEMENT);
    return found;
  }
})(CKEDITOR);
