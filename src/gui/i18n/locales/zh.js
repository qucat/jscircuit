/**
 * Simplified Chinese translations for JSCircuit GUI.
 * English strings remain the source of truth in gui.config.yaml.
 */
export default {
  app: {
    title: '电路设计器',
  },

  menu: {
    File: '文件',
    Edit: '编辑',
    Insert: '插入',
    View: '视图',
  },

  menuItem: {
    openNetlist: '打开网表...',
    saveNetlist: '保存网表...',
    copyNetlistToClipboard: '复制网表',
    pasteNetlistFromClipboard: '粘贴网表...',
    deleteAll: '清空全部',
    selectAll: '全选',
    deselectAll: '取消全选',
    copyElements: '复制',
    pasteElements: '粘贴',
    'edit.undo': '撤销',
    'edit.redo': '重做',
    deleteSelection: '删除',
    nudgeRight: '右移',
    nudgeLeft: '左移',
    nudgeUp: '上移',
    nudgeDown: '下移',
    rotateElement: '旋转元件',
    rotateElementRight: '向右旋转',
    rotateElementLeft: '向左旋转',
    rotateElementUp: '向上旋转',
    rotateElementDown: '向下旋转',
    'view.zoomIn': '放大',
    'view.zoomOut': '缩小',
    'view.recenter': '重新居中',
    'view.language': '语言',
  },

  component: {
    wire: {
      menuLabel: '导线',
      propertyPanel: {
        title: '导线属性',
        description: '理想导体导线',
        helpText: '导线没有可配置的电气参数',
      },
    },
    junction: {
      menuLabel: '约瑟夫森结',
      propertyPanel: {
        title: '指定标签和/或约瑟夫森电感（单位：亨利）',
        description: '注意 L = (hbar/2e)**2/[约瑟夫森能量，单位：焦耳]',
        field: { inductance: '电感', label: '标签' },
      },
    },
    inductor: {
      menuLabel: '电感',
      propertyPanel: {
        title: '指定标签和/或电感（单位：亨利）',
        description: '注意 L = (hbar/2e)**2/[约瑟夫森能量，单位：焦耳]',
        field: { inductance: '电感', label: '标签' },
      },
    },
    capacitor: {
      menuLabel: '电容',
      propertyPanel: {
        title: '指定标签和/或电容（单位：法拉）',
        field: { capacitance: '电容', label: '标签' },
      },
    },
    resistor: {
      menuLabel: '电阻',
      propertyPanel: {
        title: '指定标签和/或电阻（单位：欧姆）',
        field: { resistance: '电阻', label: '标签' },
      },
    },
    ground: {
      menuLabel: '接地',
      propertyPanel: {
        title: '接地属性',
        description: '参考点（0V）',
        helpText: '接地没有可配置的电气参数',
      },
    },
  },

  propertyPanel: {
    header: '电路编辑器',
    cancel: '取消',
    ok: '确定',
    fallbackTitle: '配置 {type} 属性',
    labelField: '标签',
    labelPlaceholder: '输入元件标签',
    warning: {
      title: '⚠️ 属性不完整',
      intro: '请至少指定以下一项：',
      labelItem: '元件的标签',
      propertyItem: '属性值（电阻、电容等）',
      footer: '这有助于在电路中正确识别和使用该元件。',
      ok: '确定',
    },
  },

  pasteDialog: {
    title: '粘贴网表',
    description: '在下方粘贴 QuCat 网表（例如从 Jupyter 单元格复制），然后点击导入。',
    cancel: '取消',
    import: '导入',
  },

  languageDialog: {
    title: '语言',
    description: '选择菜单和对话框的显示语言。',
    cancel: '取消',
    save: '保存',
  },

  command: {
    noElementsToCopy: '没有可复制的电路元件，请先添加一些元件。',
    copyError: '复制网表到剪贴板时出错：{message}',
    netlistCopied: '网表已复制到剪贴板',
    copyFailed: '复制到剪贴板失败',
    noElementsToSave: '没有可保存的电路元件，请先添加一些元件。',
    saveError: '保存网表时出错：{message}',
    noValidElementsInFile: '所选文件中没有有效的电路元件。',
    loadError: '加载网表文件时出错：{message}',
    noValidElementsInPaste: '粘贴的文本中没有有效的电路元件。',
    importSuccess: '已从网表导入 {count} 个元件。',
    invalidNetlist: '无效的网表：{message}',
  },
};
