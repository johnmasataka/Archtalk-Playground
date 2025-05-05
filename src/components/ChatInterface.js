import React, { useState, useEffect, useRef } from 'react';
import useStore from '../store';
import './ChatInterface.css';

const ChatInterface = () => {
  const { messages, sendToGPT, isLoadingChat } = useStore();
  const [inputValue, setInputValue] = useState('');
  const [typingMessages, setTypingMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpModalLanguage, setHelpModalLanguage] = useState('en');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingMessages]);

  // Handle typing effects for new messages
  useEffect(() => {
    // If a new message is added and it's an AI reply
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      const latestMessage = messages[messages.length - 1];
      
      // Check if this message is already in typingMessages
      const messageExists = typingMessages.some(m => m.id === messages.length - 1);
      
      if (!messageExists) {
        // Create a new typed message
        const newTypingMessage = {
          id: messages.length - 1,
          role: latestMessage.role,
          content: '',
          fullContent: latestMessage.content,
          currentIndex: 0,
          isComplete: false
        };
        
        setTypingMessages(prev => [...prev.filter(m => m.id !== newTypingMessage.id), newTypingMessage]);
      }
    }
  }, [messages]);

  // Timer for typing effects
  useEffect(() => {
    // Find all incomplete typing messages
    const incompleteMessages = typingMessages.filter(msg => !msg.isComplete);
    
    if (incompleteMessages.length > 0) {
      const typingInterval = setInterval(() => {
        setTypingMessages(prevTypingMessages => {
          return prevTypingMessages.map(msg => {
            if (!msg.isComplete) {
              const nextIndex = msg.currentIndex + 1;
              const nextChar = msg.fullContent[msg.currentIndex];
              
              if (nextIndex > msg.fullContent.length) {
                return { ...msg, isComplete: true };
              }
              
              return {
                ...msg,
                content: msg.content + nextChar,
                currentIndex: nextIndex
              };
            }
            return msg;
          });
        });
      }, 2); // typing speed 
      
      return () => clearInterval(typingInterval);
    }
  }, [typingMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoadingChat) {
      sendToGPT(inputValue);
      setInputValue('');
    }
  };

  // Find the typing effect message corresponding to the message ID
  const getTypingMessage = (index, message) => {
    const typingMsg = typingMessages.find(m => m.id === index);
    
    if (typingMsg && message.role === 'assistant') {
      return typingMsg.content;
    }
    
    return message.content;
  };
  
  const toggleApiKeyModal = () => {
    setShowApiKeyModal(!showApiKeyModal);
  };

  const toggleHelpModal = () => {
    setShowHelpModal(!showHelpModal);
  };

  const handleLanguageChange = (languageCode) => {
    setHelpModalLanguage(languageCode);
  };

  const helpModalTranslations = {
    en: {
      title: "ArchTalk-Playground User Manual",
      overview: "ArchTalk-Playground is a 3D architectural visualization and modeling tool that allows you to view, manipulate, and transform building models in a 3D environment.",
      interfaceLayout: {
        title: "Interface Layout",
        description: "The application consists of several main components:",
        components: [
          { name: "3D Viewport", description: "The main area where the model is displayed" },
          { name: "Left Panel", description: "Contains various control buttons and tools" },
          { name: "Right Panel", description: "Building Modification and Generation" },
          { name: "Statistics Window", description: "Shows building information in the top-left corner" },
          { name: "Object Info Window", description: "Displays selected object details in the top-right corner" }
        ]
      },
      viewControls: {
        title: "View Controls",
        viewModes: {
          title: "View Modes",
          modes: [
            { name: "Perspective View", description: "Default 3D view with perspective projection" },
            { name: "Isometric View", description: "Orthographic view showing the model without perspective distortion" },
            { name: "ViewCube", description: "Interactive cube in the top-right corner for quick view orientation" }
          ]
        },
        cameraControls: {
          title: "Camera Controls",
          controls: [
            { name: "Orbit", description: "Right-click and drag to rotate the view" },
            { name: "Pan", description: "Middle-click and drag to move the view" },
            { name: "Zoom", description: "Scroll wheel to zoom in/out" },
            { name: "Ctrl + Right-click", description: "Pan the view" }
          ]
        }
      },
      toolsAndFeatures: {
        title: "Tools and Features",
        geometryTools: {
          title: "Geometry Tools",
          location: "Located in the \"Geometry\" section of the left panel:",
          tools: [
            { name: "Cube", description: "Add a 2x2x2 cube to the scene" },
            { name: "Sphere", description: "Add a sphere with radius 1" },
            { name: "Pyramid", description: "Add a four-sided pyramid" }
          ],
          usage: {
            title: "Usage",
            steps: [
              "Click to place in front of the camera",
              "Drag and drop to place at a specific location"
            ]
          }
        },
        transformTools: {
          title: "Transform Tools",
          location: "Located in the \"Transform\" section:",
          tools: [
            { name: "Move", description: "Translate selected objects" },
            { name: "Rotate", description: "Rotate selected objects" },
            { name: "Scale", description: "Resize selected objects" }
          ],
          usage: {
            title: "Usage",
            steps: [
              "Select an object by clicking on it",
              "Choose the desired transform tool",
              "Use the transform gizmo to manipulate the object"
            ]
          }
        },
        interiorTools: {
          title: "Interior Tools",
          location: "Located in the \"Interior\" section:",
          tools: [
            { name: "Room", description: "Toggle room labels visibility" },
            { name: "Outline", description: "Toggle object outlines" },
            { name: "Mesh", description: "Toggle ground grid visibility" },
            { name: "Clip Plane", description: "Add a clipping plane to cut through the model" }
          ]
        },
        exportTools: {
          title: "Export Tools",
          location: "Located in the \"Export\" section:",
          tools: [
            { name: "Export GLB", description: "Export the model in binary GLTF format" },
            { name: "Export GLTF", description: "Export the model in JSON-based GLTF format" }
          ]
        }
      },
      buildingModification: {
        title: "Building Modification and Generation",
        textBased: {
          title: "Text-Based Building Modification",
          location: "Located in the \"Modify\" section of the right panel:",
          prompt: "Text Prompt: Enter natural language descriptions to modify the building",
          usage: {
            title: "Usage",
            steps: [
              "Type your modification request in the text input field",
              "Examples of valid prompts:",
              "Press Enter or click \"Apply\" to execute the changes"
            ],
            examples: [
              "Add a second floor with 3 bedrooms and 2 bathrooms",
              "Make the building 20% taller",
              "Add a garage on the left side",
              "Change the roof style to gabled",
              "Add windows to the north-facing wall"
            ]
          }
        },
        parameterBased: {
          title: "Parameter-Based Modification",
          location: "Located in the lower right corner of the right panel:",
          controls: "Building Parameter Controls: Generated according to the current state of the building model.",
          usage: {
            title: "Usage",
            steps: [
              "Drag sliders to adjust values",
              "Changes are applied in real-time",
              "Multiple parameters can be adjusted"
            ]
          }
        },
        generation: {
          title: "Building Generation",
          location: "Located in the \"Generate\" section:",
          prompt: "Text Prompt: Enter detailed building descriptions to generate new buildings",
          usage: {
            title: "Usage",
            steps: [
              "Type a comprehensive description of the desired building",
              "Examples of valid prompts:",
              "Press Enter or click \"Generate\" to create the building",
              "The system will generate a 3D model based on your description"
            ],
            examples: [
              "Create a U-shaped adobe house with thick earthen walls and a traditional timber beam flat roof. Include four bedrooms around a central courtyard, a communal living space, and a shaded veranda. Bedrooms should each have a small window, and the main entry should face the prevailing wind for natural cooling.",
              "I want to design a house for a six person family. Three bedrooms are required, the parents may need a reading studio, the kids want a room for play, and they also need a large storage. The house only needs one story.",
              "Create a light-filled single-floor beach house for a nature photographer. The living area should be 6m × 6m with floor-to-ceiling windows on the west side facing the ocean. Include one darkroom (2.5m × 3m) with no external windows. The entrance should be from the south with a sliding glass door. Add a small bedroom (3m × 4m) and an outdoor shower area next to the back entrance."
            ]
          }
        },
        bestPractices: {
          title: "Best Practices for Text Prompts",
          steps: [
            "Be specific about dimensions and proportions",
            "Include architectural style references",
            "Mention key features and elements",
            "Specify materials and finishes when relevant",
            "Include spatial relationships between elements"
          ],
          example: {
            title: "Example of a good prompt:",
            content: "Generate a three-story modern house with:",
            features: [
              "2000 sq ft per floor",
              "Floor-to-ceiling windows on the south side",
              "Flat roof with solar panels",
              "Attached two-car garage",
              "Open floor plan on the first floor",
              "4 bedrooms and 3 bathrooms",
              "Balcony on the master bedroom"
            ]
          }
        },
        combiningTools: {
          title: "Combining Tools",
          description: "You can combine different modification methods:",
          steps: [
            "Start with a generated building",
            "Use sliders to adjust basic dimensions",
            "Apply text prompts for detailed modifications",
            "Use transform tools for fine-tuning",
            "Export the final result"
          ]
        }
      },
      workingWithObjects: {
        title: "Working with Objects",
        selecting: {
          title: "Selecting Objects",
          steps: [
            "Click on any object to select it",
            "Selected objects will be highlighted",
            "Object information will appear in the top-right panel"
          ]
        },
        transforming: {
          title: "Transforming Objects",
          steps: [
            "Select an object",
            "Choose a transform tool (Move/Rotate/Scale)",
            "Use the transform gizmo:"
          ],
          gizmo: {
            red: "Red: X-axis",
            green: "Green: Y-axis",
            blue: "Blue: Z-axis",
            yellow: "Yellow: Free movement/rotation"
          }
        },
        addingGeometry: {
          title: "Adding Geometry",
          steps: [
            "Click on a geometry button (Cube/Sphere/Pyramid) to add it in front of the camera",
            "Or drag and drop the geometry button to place it at a specific location",
            "The new geometry will be automatically selected"
          ]
        },
        clippingPlanes: {
          title: "Using Clipping Planes",
          steps: [
            "Click the \"Clip Plane\" button to add a clipping plane",
            "Use the transform tools to position and orient the plane",
            "The model will be clipped along the plane",
            "Press ESC to remove the clipping plane"
          ]
        }
      },
      tipsAndBestPractices: {
        title: "Tips and Best Practices",
        steps: [
          "Use the ViewCube for quick view orientation",
          "Hold Shift while transforming for more precise control",
          "Use the grid for better spatial reference",
          "Toggle outlines for better visibility of complex models",
          "Use clipping planes to inspect interior spaces"
        ]
      },
      keyboardShortcuts: {
        title: "Keyboard Shortcuts",
        shortcuts: [
          { key: "ESC", description: "Cancel current operation or remove clipping plane" },
          { key: "Shift + Right-click", description: "Pan the view" },
          { key: "Middle-click + Drag", description: "Pan the view" },
          { key: "Right-click + Drag", description: "Orbit the view" },
          { key: "Scroll Wheel", description: "Zoom in/out" }
        ]
      },
      troubleshooting: {
        title: "Troubleshooting",
        issues: [
          { description: "If objects don't respond to selection, ensure they are not locked or hidden" },
          { description: "If transform tools don't appear, make sure an object is selected" },
          { description: "If the view becomes unresponsive, try resetting the view using the ViewCube" },
          { description: "If geometry placement seems off, check that you're not trying to place inside other objects" }
        ]
      }
    },
    ja: {
      title: "ArchTalk-Playground ユーザーマニュアル",
      overview: "ArchTalk-Playgroundは、3D建築ビジュアライゼーションおよびモデリングツールで、建物モデルを3D環境で表示、操作、変換することができます。",
      interfaceLayout: {
        title: "インターフェースレイアウト",
        description: "アプリケーションは以下の主要コンポーネントで構成されています：",
        components: [
          { name: "3Dビューポート", description: "モデルが表示されるメインエリア" },
          { name: "左パネル", description: "各種コントロールボタンとツールを含む" },
          { name: "右パネル", description: "建物の修正と生成" },
          { name: "統計ウィンドウ", description: "左上に建物情報を表示" },
          { name: "オブジェクト情報ウィンドウ", description: "右上に選択したオブジェクトの詳細を表示" }
        ]
      },
      viewControls: {
        title: "ビューコントロール",
        viewModes: {
          title: "ビューモード",
          modes: [
            { name: "パースペクティブビュー", description: "デフォルトの3Dビュー（透視投影）" },
            { name: "アイソメトリックビュー", description: "透視歪みのない正投影ビュー" },
            { name: "ビューキューブ", description: "右上のインタラクティブなキューブで素早くビュー方向を変更" }
          ]
        },
        cameraControls: {
          title: "カメラコントロール",
          controls: [
            { name: "オービット", description: "右クリックでドラッグしてビューを回転" },
            { name: "パン", description: "中クリックでドラッグしてビューを移動" },
            { name: "ズーム", description: "スクロールホイールでズームイン/アウト" },
            { name: "Ctrl + 右クリック", description: "ビューをパン" }
          ]
        }
      },
      toolsAndFeatures: {
        title: "ツールと機能",
        geometryTools: {
          title: "ジオメトリツール",
          location: "左パネルの「ジオメトリ」セクションにあります：",
          tools: [
            { name: "立方体", description: "2x2x2の立方体をシーンに追加" },
            { name: "球体", description: "半径1の球体を追加" },
            { name: "ピラミッド", description: "四角錐を追加" }
          ],
          usage: {
            title: "使用方法",
            steps: [
              "クリックしてカメラの前に配置",
              "ドラッグ＆ドロップで特定の位置に配置"
            ]
          }
        },
        transformTools: {
          title: "変形ツール",
          location: "「変形」セクションにあります：",
          tools: [
            { name: "移動", description: "選択したオブジェクトを移動" },
            { name: "回転", description: "選択したオブジェクトを回転" },
            { name: "スケール", description: "選択したオブジェクトのサイズを変更" }
          ],
          usage: {
            title: "使用方法",
            steps: [
              "オブジェクトをクリックして選択",
              "目的の変形ツールを選択",
              "変形ギズモを使用してオブジェクトを操作"
            ]
          }
        },
        interiorTools: {
          title: "内部ツール",
          location: "「内部」セクションにあります：",
          tools: [
            { name: "部屋", description: "部屋ラベルの表示/非表示を切り替え" },
            { name: "アウトライン", description: "オブジェクトのアウトラインの表示/非表示を切り替え" },
            { name: "メッシュ", description: "地面グリッドの表示/非表示を切り替え" },
            { name: "クリップ平面", description: "モデルを切断するクリップ平面を追加" }
          ]
        },
        exportTools: {
          title: "エクスポートツール",
          location: "「エクスポート」セクションにあります：",
          tools: [
            { name: "GLBエクスポート", description: "バイナリGLTF形式でモデルをエクスポート" },
            { name: "GLTFエクスポート", description: "JSONベースのGLTF形式でモデルをエクスポート" }
          ]
        }
      },
      buildingModification: {
        title: "建物の修正と生成",
        textBased: {
          title: "テキストベースの建物修正",
          location: "右パネルの「修正」セクションにあります：",
          prompt: "テキストプロンプト：建物を修正するための自然言語の説明を入力",
          usage: {
            title: "使用方法",
            steps: [
              "テキスト入力フィールドに修正リクエストを入力",
              "有効なプロンプトの例：",
              "Enterキーを押すか「適用」をクリックして変更を実行"
            ],
            examples: [
              "3つの寝室と2つのバスルームがある2階を追加",
              "建物を20%高くする",
              "左側にガレージを追加",
              "屋根のスタイルを切妻屋根に変更",
              "北向きの壁に窓を追加"
            ]
          }
        },
        parameterBased: {
          title: "パラメータベースの修正",
          location: "右パネルの右下にあります：",
          controls: "建物パラメータコントロール：建物モデルの現在の状態に応じて生成されます。",
          usage: {
            title: "使用方法",
            steps: [
              "スライダーをドラッグして値を調整",
              "変更はリアルタイムで適用されます",
              "複数のパラメータを調整できます"
            ]
          }
        },
        generation: {
          title: "建物の生成",
          location: "「生成」セクションにあります：",
          prompt: "テキストプロンプト：新しい建物を生成するための詳細な説明を入力",
          usage: {
            title: "使用方法",
            steps: [
              "希望する建物の包括的な説明を入力",
              "有効なプロンプトの例：",
              "Enterキーを押すか「生成」をクリックして建物を作成",
              "システムは説明に基づいて3Dモデルを生成します"
            ],
            examples: [
              "厚い土壁と伝統的な木造梁の平屋根を持つU字型のアドベハウスを作成。中央の中庭を囲む4つの寝室、共有スペース、日陰のベランダを含める。寝室にはそれぞれ小さな窓があり、メインエントランスは自然換気のために卓越風に向いている。",
              "6人家族のための家を設計したい。3つの寝室が必要で、両親は読書スタジオが必要かもしれない。子供たちは遊び部屋と大きな収納スペースが必要。家は1階建てのみ。",
              "自然写真家のための明るい1階建てのビーチハウスを作成。リビングエリアは6m×6mで、西側面向海洋の落地窗。包括一個外部ウィンドウのない暗室（2.5m×3m）。入口は南側からスライディングガラスドアのある玄関を追加。小さな寝室（3m×4m）と裏口の隣に屋外シャワーエリアを追加。"
            ]
          }
        },
        bestPractices: {
          title: "テキストプロンプトのベストプラクティス",
          steps: [
            "寸法と比率について具体的に指定",
            "建築スタイルの参照を含める",
            "主要な特徴と要素を言及",
            "関連する場合は材料と仕上げを指定",
            "要素間の空間的関係を含める"
          ],
          example: {
            title: "良いプロンプトの例：",
            content: "3階建てのモダンハウスを生成：",
            features: [
              "各階2000平方フィート",
              "南側にフロアから天井までの窓",
              "ソーラーパネル付きの平屋根",
              "2台収容の付属ガレージ",
              "1階のオープンフロアプラン",
              "4つの寝室と3つのバスルーム",
              "マスターベッドルームのバルコニー"
            ]
          }
        },
        combiningTools: {
          title: "ツールの組み合わせ",
          description: "異なる修正方法を組み合わせることができます：",
          steps: [
            "生成された建物から開始",
            "スライダーを使用して基本的な寸法を調整",
            "詳細な修正のためにテキストプロンプトを適用",
            "微調整のために変形ツールを使用",
            "最終結果をエクスポート"
          ]
        }
      },
      workingWithObjects: {
        title: "オブジェクトの操作",
        selecting: {
          title: "オブジェクトの選択",
          steps: [
            "オブジェクトをクリックして選択",
            "選択されたオブジェクトはハイライト表示されます",
            "オブジェクト情報が右上のパネルに表示されます"
          ]
        },
        transforming: {
          title: "オブジェクトの変形",
          steps: [
            "オブジェクトを選択",
            "変形ツール（移動/回転/スケール）を選択",
            "変形ギズモを使用："
          ],
          gizmo: {
            red: "赤：X軸",
            green: "緑：Y軸",
            blue: "青：Z軸",
            yellow: "黄：自由移動/回転"
          }
        },
        addingGeometry: {
          title: "ジオメトリの追加",
          steps: [
            "ジオメトリボタン（立方体/球体/ピラミッド）をクリックしてカメラの前に追加",
            "またはジオメトリボタンをドラッグ＆ドロップして特定の位置に配置",
            "新しいジオメトリは自動的に選択されます"
          ]
        },
        clippingPlanes: {
          title: "クリップ平面の使用",
          steps: [
            "「クリップ平面」ボタンをクリックしてクリップ平面を追加",
            "変形ツールを使用して平面の位置と向きを設定",
            "モデルは平面に沿ってクリップされます",
            "ESCキーを押してクリップ平面を削除"
          ]
        }
      },
      tipsAndBestPractices: {
        title: "ヒントとベストプラクティス",
        steps: [
          "ビューキューブを使用して素早くビュー方向を変更",
          "変形中にShiftキーを押してより正確な制御",
          "空間参照のためにグリッドを使用",
          "複雑なモデルの視認性を向上させるためにアウトラインを切り替え",
          "内部空間を検査するためにクリップ平面を使用"
        ]
      },
      keyboardShortcuts: {
        title: "キーボードショートカット",
        shortcuts: [
          { key: "ESC", description: "現在の操作をキャンセルまたはクリップ平面を削除" },
          { key: "Shift + 右クリック", description: "ビューをパン" },
          { key: "中クリック + ドラッグ", description: "ビューをパン" },
          { key: "右クリック + ドラッグ", description: "ビューを回転" },
          { key: "スクロールホイール", description: "ズームイン/アウト" }
        ]
      },
      troubleshooting: {
        title: "トラブルシューティング",
        issues: [
          { description: "オブジェクトが選択に反応しない場合は、ロックされていないか非表示になっていないか確認してください" },
          { description: "変形ツールが表示されない場合は、オブジェクトが選択されていることを確認してください" },
          { description: "ビューが反応しない場合は、ビューキューブを使用してビューをリセットしてみてください" },
          { description: "ジオメトリの配置がおかしい場合は、他のオブジェクトの中に配置しようとしていないか確認してください" }
        ]
      }
    },
    'zh-CN': {
      title: "ArchTalk-Playground 用户手册",
      overview: "ArchTalk-Playground是一个3D建筑可视化和建模工具，允许您在3D环境中查看、操作和转换建筑模型。",
      interfaceLayout: {
        title: "界面布局",
        description: "应用程序由以下几个主要组件组成：",
        components: [
          { name: "3D视口", description: "显示模型的主要区域" },
          { name: "左侧面板", description: "包含各种控制按钮和工具" },
          { name: "右侧面板", description: "建筑修改和生成" },
          { name: "统计窗口", description: "在左上角显示建筑信息" },
          { name: "对象信息窗口", description: "在右上角显示选定对象的详细信息" }
        ]
      },
      viewControls: {
        title: "视图控制",
        viewModes: {
          title: "视图模式",
          modes: [
            { name: "透视视图", description: "默认的3D视图（透视投影）" },
            { name: "等轴视图", description: "无透视变形的正交视图" },
            { name: "视图立方体", description: "右上角的交互式立方体，用于快速改变视图方向" }
          ]
        },
        cameraControls: {
          title: "相机控制",
          controls: [
            { name: "环绕", description: "右键拖动以旋转视图" },
            { name: "平移", description: "中键拖动以移动视图" },
            { name: "缩放", description: "滚轮缩放视图" },
            { name: "Ctrl + 右键", description: "平移视图" }
          ]
        }
      },
      toolsAndFeatures: {
        title: "工具和功能",
        geometryTools: {
          title: "几何工具",
          location: "位于左侧面板的\"几何\"部分：",
          tools: [
            { name: "立方体", description: "在场景中添加2x2x2的立方体" },
            { name: "球体", description: "添加半径为1的球体" },
            { name: "金字塔", description: "添加四棱锥" }
          ],
          usage: {
            title: "使用方法",
            steps: [
              "点击在相机前方放置",
              "拖放以在特定位置放置"
            ]
          }
        },
        transformTools: {
          title: "变换工具",
          location: "位于\"变换\"部分：",
          tools: [
            { name: "移动", description: "平移选中的对象" },
            { name: "旋转", description: "旋转选中的对象" },
            { name: "缩放", description: "调整选中对象的大小" }
          ],
          usage: {
            title: "使用方法",
            steps: [
              "点击选择对象",
              "选择所需的变换工具",
              "使用变换控制器操作对象"
            ]
          }
        },
        interiorTools: {
          title: "内部工具",
          location: "位于\"内部\"部分：",
          tools: [
            { name: "房间", description: "切换房间标签的可见性" },
            { name: "轮廓", description: "切换对象轮廓的可见性" },
            { name: "网格", description: "切换地面网格的可见性" },
            { name: "裁剪平面", description: "添加裁剪平面以切割模型" }
          ]
        },
        exportTools: {
          title: "导出工具",
          location: "位于\"导出\"部分：",
          tools: [
            { name: "导出GLB", description: "以二进制GLTF格式导出模型" },
            { name: "导出GLTF", description: "以JSON格式的GLTF导出模型" }
          ]
        }
      },
      buildingModification: {
        title: "建筑修改和生成",
        textBased: {
          title: "基于文本的建筑修改",
          location: "位于右侧面板的\"修改\"部分：",
          prompt: "文本提示：输入自然语言描述来修改建筑",
          usage: {
            title: "使用方法",
            steps: [
              "在文本输入框中输入修改请求",
              "有效提示的示例：",
              "按Enter键或点击\"应用\"执行更改"
            ],
            examples: [
              "添加一个带有3间卧室和2间浴室的二楼",
              "将建筑高度增加20%",
              "在左侧添加一个车库",
              "将屋顶样式改为山墙式",
              "在北墙上添加窗户"
            ]
          }
        },
        parameterBased: {
          title: "基于参数的修改",
          location: "位于右侧面板的右下角：",
          controls: "建筑参数控制：根据建筑模型的当前状态生成。",
          usage: {
            title: "使用方法",
            steps: [
              "拖动滑块调整数值",
              "更改实时应用",
              "可以调整多个参数"
            ]
          }
        },
        generation: {
          title: "建筑生成",
          location: "位于\"生成\"部分：",
          prompt: "文本提示：输入详细的建筑描述来生成新建筑",
          usage: {
            title: "使用方法",
            steps: [
              "输入所需建筑的全面描述",
              "有效提示的示例：",
              "按Enter键或点击\"生成\"创建建筑",
              "系统将根据描述生成3D模型"
            ],
            examples: [
              "创建一个U形的土坯房屋，带有厚实的土墙和传统的木梁平屋顶。包括围绕中央庭院的四间卧室、一个公共生活空间和一个带遮阳的阳台。每间卧室都应该有一个小窗户，主入口应该面向盛行风以自然通风。",
              "我想为一个六口之家设计房子。需要三间卧室，父母可能需要一个阅读工作室，孩子们想要一个游戏室，还需要一个大型储物空间。房子只需要一层。",
              "为自然摄影师创建一个采光良好的单层海滩房屋。起居区应为6m×6m，西侧面向海洋的落地窗。包括一个没有外部窗户的暗房（2.5m×3m）。入口应从南侧开始，带有滑动玻璃门。添加一个小卧室（3m×4m）和后入口旁边的户外淋浴区。"
            ]
          }
        },
        bestPractices: {
          title: "文本提示的最佳实践",
          steps: [
            "具体说明尺寸和比例",
            "包含建筑风格参考",
            "提及关键特征和元素",
            "相关时指定材料和饰面",
            "包含元素之间的空间关系"
          ],
          example: {
            title: "好的提示示例：",
            content: "生成一个三层现代房屋：",
            features: [
              "每层2000平方英尺",
              "南侧落地窗",
              "带太阳能电池板的平屋顶",
              "可容纳两辆车的附属车库",
              "一楼的开放式平面图",
              "4间卧室和3间浴室",
              "主卧室的阳台"
            ]
          }
        },
        combiningTools: {
          title: "工具组合",
          description: "您可以组合不同的修改方法：",
          steps: [
            "从生成的建筑开始",
            "使用滑块调整基本尺寸",
            "应用文本提示进行详细修改",
            "使用变换工具进行微调",
            "导出最终结果"
          ]
        }
      },
      workingWithObjects: {
        title: "对象操作",
        selecting: {
          title: "选择对象",
          steps: [
            "点击任何对象进行选择",
            "选中的对象将高亮显示",
            "对象信息将显示在右上角面板中"
          ]
        },
        transforming: {
          title: "变换对象",
          steps: [
            "选择一个对象",
            "选择变换工具（移动/旋转/缩放）",
            "使用变换控制器："
          ],
          gizmo: {
            red: "红色：X轴",
            green: "绿色：Y轴",
            blue: "蓝色：Z轴",
            yellow: "黄色：自由移动/旋转"
          }
        },
        addingGeometry: {
          title: "添加几何体",
          steps: [
            "点击几何体按钮（立方体/球体/金字塔）在相机前方添加",
            "或拖放几何体按钮到特定位置",
            "新几何体将自动被选中"
          ]
        },
        clippingPlanes: {
          title: "使用裁剪平面",
          steps: [
            "点击\"裁剪平面\"按钮添加裁剪平面",
            "使用变换工具定位和定向平面",
            "模型将沿平面裁剪",
            "按ESC键移除裁剪平面"
          ]
        }
      },
      tipsAndBestPractices: {
        title: "提示和最佳实践",
        steps: [
          "使用视图立方体快速改变视图方向",
          "变换时按住Shift键进行更精确的控制",
          "使用网格获得更好的空间参考",
          "切换轮廓以获得复杂模型的更好可见性",
          "使用裁剪平面检查内部空间"
        ]
      },
      keyboardShortcuts: {
        title: "键盘快捷键",
        shortcuts: [
          { key: "ESC", description: "取消当前操作或移除裁剪平面" },
          { key: "Shift + 右键", description: "平移视图" },
          { key: "中键 + 拖动", description: "平移视图" },
          { key: "右键 + 拖动", description: "旋转视图" },
          { key: "滚轮", description: "缩放视图" }
        ]
      },
      troubleshooting: {
        title: "故障排除",
        issues: [
          { description: "如果对象不响应选择，请确保它们未被锁定或隐藏" },
          { description: "如果变换工具不出现，请确保已选择对象" },
          { description: "如果视图无响应，请尝试使用视图立方体重置视图" },
          { description: "如果几何体放置看起来不对，请检查是否尝试将其放置在其他对象内部" }
        ]
      }
    },
    'zh-TW': {
      title: "ArchTalk-Playground 用戶手冊",
      overview: "ArchTalk-Playground是一個3D建築可視化和建模工具，允許您在3D環境中查看、操作和轉換建築模型。",
      interfaceLayout: {
        title: "介面佈局",
        description: "應用程式由以下幾個主要組件組成：",
        components: [
          { name: "3D視口", description: "顯示模型的主要區域" },
          { name: "左側面板", description: "包含各種控制按鈕和工具" },
          { name: "右側面板", description: "建築修改和生成" },
          { name: "統計視窗", description: "在左上角顯示建築資訊" },
          { name: "物件資訊視窗", description: "在右上角顯示選定物件的詳細資訊" }
        ]
      },
      viewControls: {
        title: "視圖控制",
        viewModes: {
          title: "視圖模式",
          modes: [
            { name: "透視視圖", description: "預設的3D視圖（透視投影）" },
            { name: "等軸視圖", description: "無透視變形的正交視圖" },
            { name: "視圖立方體", description: "右上角的互動式立方體，用於快速改變視圖方向" }
          ]
        },
        cameraControls: {
          title: "相機控制",
          controls: [
            { name: "環繞", description: "右鍵拖動以旋轉視圖" },
            { name: "平移", description: "中鍵拖動以移動視圖" },
            { name: "縮放", description: "滾輪縮放視圖" },
            { name: "Ctrl + 右鍵", description: "平移視圖" }
          ]
        }
      },
      toolsAndFeatures: {
        title: "工具和功能",
        geometryTools: {
          title: "幾何工具",
          location: "位於左側面板的\"幾何\"部分：",
          tools: [
            { name: "立方體", description: "在場景中添加2x2x2的立方體" },
            { name: "球體", description: "添加半徑為1的球體" },
            { name: "金字塔", description: "添加四稜錐" }
          ],
          usage: {
            title: "使用方法",
            steps: [
              "點擊在相機前方放置",
              "拖放以在特定位置放置"
            ]
          }
        },
        transformTools: {
          title: "變換工具",
          location: "位於\"變換\"部分：",
          tools: [
            { name: "移動", description: "平移選中的物件" },
            { name: "旋轉", description: "旋轉選中的物件" },
            { name: "縮放", description: "調整選中物件的大小" }
          ],
          usage: {
            title: "使用方法",
            steps: [
              "點擊選擇物件",
              "選擇所需的變換工具",
              "使用變換控制器操作物件"
            ]
          }
        },
        interiorTools: {
          title: "內部工具",
          location: "位於\"內部\"部分：",
          tools: [
            { name: "房間", description: "切換房間標籤的可見性" },
            { name: "輪廓", description: "切換物件輪廓的可見性" },
            { name: "網格", description: "切換地面網格的可見性" },
            { name: "裁剪平面", description: "添加裁剪平面以切割模型" }
          ]
        },
        exportTools: {
          title: "匯出工具",
          location: "位於\"匯出\"部分：",
          tools: [
            { name: "匯出GLB", description: "以二進制GLTF格式匯出模型" },
            { name: "匯出GLTF", description: "以JSON格式的GLTF匯出模型" }
          ]
        }
      },
      buildingModification: {
        title: "建築修改和生成",
        textBased: {
          title: "基於文字的建築修改",
          location: "位於右側面板的\"修改\"部分：",
          prompt: "文字提示：輸入自然語言描述來修改建築",
          usage: {
            title: "使用方法",
            steps: [
              "在文字輸入框中輸入修改請求",
              "有效提示的範例：",
              "按Enter鍵或點擊\"應用\"執行更改"
            ],
            examples: [
              "添加一個帶有3間臥室和2間浴室的二樓",
              "將建築高度增加20%",
              "在左側添加一個車庫",
              "將屋頂樣式改為山牆式",
              "在北牆上添加窗戶"
            ]
          }
        },
        parameterBased: {
          title: "基於參數的修改",
          location: "位於右側面板的右下角：",
          controls: "建築參數控制：根據建築模型的當前狀態生成。",
          usage: {
            title: "使用方法",
            steps: [
              "拖動滑塊調整數值",
              "更改即時應用",
              "可以調整多個參數"
            ]
          }
        },
        generation: {
          title: "建築生成",
          location: "位於\"生成\"部分：",
          prompt: "文字提示：輸入詳細的建築描述來生成新建築",
          usage: {
            title: "使用方法",
            steps: [
              "輸入所需建築的全面描述",
              "有效提示的範例：",
              "按Enter鍵或點擊\"生成\"創建建築",
              "系統將根據描述生成3D模型"
            ],
            examples: [
              "創建一個U形的土坯房屋，帶有厚實的土牆和傳統的木樑平屋頂。包括圍繞中央庭院的四間臥室、一個公共生活空間和一個帶遮陽的陽台。每間臥室都應該有一個小窗戶，主入口應該面向盛行風以自然通風。",
              "我想為一個六口之家設計房子。需要三間臥室，父母可能需要一個閱讀工作室，孩子們想要一個遊戲室，還需要一個大型儲物空間。房子只需要一層。",
              "為自然攝影師創建一個採光良好的單層海灘房屋。起居區應為6m×6m，西側面向海洋的落地窗。包括一個沒有外部窗戶的暗房（2.5m×3m）。入口應從南側開始，帶有滑動玻璃門。添加一個小臥室（3m×4m）和後入口旁邊的戶外淋浴區。"
            ]
          }
        },
        bestPractices: {
          title: "文字提示的最佳實踐",
          steps: [
            "具體說明尺寸和比例",
            "包含建築風格參考",
            "提及關鍵特徵和元素",
            "相關時指定材料和飾面",
            "包含元素之間的空間關係"
          ],
          example: {
            title: "好的提示範例：",
            content: "生成一個三層現代房屋：",
            features: [
              "每層2000平方英尺",
              "南側落地窗",
              "帶太陽能電池板的平屋頂",
              "可容納兩輛車的附屬車庫",
              "一樓的開放式平面圖",
              "4間臥室和3間浴室",
              "主臥室的陽台"
            ]
          }
        },
        combiningTools: {
          title: "工具組合",
          description: "您可以組合不同的修改方法：",
          steps: [
            "從生成的建築開始",
            "使用滑塊調整基本尺寸",
            "應用文字提示進行詳細修改",
            "使用變換工具進行微調",
            "匯出最終結果"
          ]
        }
      },
      workingWithObjects: {
        title: "物件操作",
        selecting: {
          title: "選擇物件",
          steps: [
            "點擊任何物件進行選擇",
            "選中的物件將高亮顯示",
            "物件資訊將顯示在右上角面板中"
          ]
        },
        transforming: {
          title: "變換物件",
          steps: [
            "選擇一個物件",
            "選擇變換工具（移動/旋轉/縮放）",
            "使用變換控制器："
          ],
          gizmo: {
            red: "紅色：X軸",
            green: "綠色：Y軸",
            blue: "藍色：Z軸",
            yellow: "黃色：自由移動/旋轉"
          }
        },
        addingGeometry: {
          title: "添加幾何體",
          steps: [
            "點擊幾何體按鈕（立方體/球體/金字塔）在相機前方添加",
            "或拖放幾何體按鈕到特定位置",
            "新幾何體將自動被選中"
          ]
        },
        clippingPlanes: {
          title: "使用裁剪平面",
          steps: [
            "點擊\"裁剪平面\"按鈕添加裁剪平面",
            "使用變換工具定位和定向平面",
            "模型將沿平面裁剪",
            "按ESC鍵移除裁剪平面"
          ]
        }
      },
      tipsAndBestPractices: {
        title: "提示和最佳實踐",
        steps: [
          "使用視圖立方體快速改變視圖方向",
          "變換時按住Shift鍵進行更精確的控制",
          "使用網格獲得更好的空間參考",
          "切換輪廓以獲得複雜模型的更好可見性",
          "使用裁剪平面檢查內部空間"
        ]
      },
      keyboardShortcuts: {
        title: "鍵盤快捷鍵",
        shortcuts: [
          { key: "ESC", description: "取消當前操作或移除裁剪平面" },
          { key: "Shift + 右鍵", description: "平移視圖" },
          { key: "中鍵 + 拖動", description: "平移視圖" },
          { key: "右鍵 + 拖動", description: "旋轉視圖" },
          { key: "滾輪", description: "縮放視圖" }
        ]
      },
      troubleshooting: {
        title: "故障排除",
        issues: [
          { description: "如果物件不響應選擇，請確保它們未被鎖定或隱藏" },
          { description: "如果變換工具不出現，請確保已選擇物件" },
          { description: "如果視圖無響應，請嘗試使用視圖立方體重置視圖" },
          { description: "如果幾何體放置看起來不對，請檢查是否嘗試將其放置在其他物件內部" }
        ]
      }
    }
  };

  return (
    <>
      {showHelpModal && (
        <div className="help-modal-overlay" onClick={toggleHelpModal}>
          <div className="help-modal" onClick={e => e.stopPropagation()}>
            <div className="help-content">
              <h1>{helpModalTranslations[helpModalLanguage].title}</h1>
              
              <div className="language-buttons">
                <button 
                  className={`language-button ${helpModalLanguage === 'en' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('en')}
                >
                  English
                </button>
                <button 
                  className={`language-button ${helpModalLanguage === 'ja' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('ja')}
                >
                  日本語
                </button>
                <button 
                  className={`language-button ${helpModalLanguage === 'zh-CN' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('zh-CN')}
                >
                  简体中文
                </button>
                <button 
                  className={`language-button ${helpModalLanguage === 'zh-TW' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('zh-TW')}
                >
                  繁體中文
                </button>
              </div>
              
              <section className="help-section">
                <h2>Overview</h2>
                <p>{helpModalTranslations[helpModalLanguage].overview}</p>
              </section>

              <section className="help-section">
                <h2>{helpModalTranslations[helpModalLanguage].interfaceLayout.title}</h2>
                <p>{helpModalTranslations[helpModalLanguage].interfaceLayout.description}</p>
                <ul className="dash-list">
                  {helpModalTranslations[helpModalLanguage].interfaceLayout.components.map((component, index) => (
                    <li key={index}>
                      <strong>{component.name}</strong>: {component.description}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="help-section">
                <h2>{helpModalTranslations[helpModalLanguage].viewControls.title}</h2>
                
                <h3>{helpModalTranslations[helpModalLanguage].viewControls.viewModes.title}</h3>
                <ul className="dash-list">
                  {helpModalTranslations[helpModalLanguage].viewControls.viewModes.modes.map((mode, index) => (
                    <li key={index}>
                      <strong>{mode.name}</strong>: {mode.description}
                    </li>
                  ))}
                </ul>

                <h3>{helpModalTranslations[helpModalLanguage].viewControls.cameraControls.title}</h3>
                <ul className="dash-list">
                  {helpModalTranslations[helpModalLanguage].viewControls.cameraControls.controls.map((control, index) => (
                    <li key={index}>
                      <strong>{control.name}</strong>: {control.description}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="help-section">
                <h2>{helpModalTranslations[helpModalLanguage].toolsAndFeatures.title}</h2>
                
                <div className="help-section">
                  <h4>{helpModalTranslations[helpModalLanguage].toolsAndFeatures.geometryTools.title}</h4>
                  <p>{helpModalTranslations[helpModalLanguage].toolsAndFeatures.geometryTools.location}</p>
                  <ul className="dash-list">
                    {helpModalTranslations[helpModalLanguage].toolsAndFeatures.geometryTools.tools.map((tool, index) => (
                      <li key={index}>
                        <strong>{tool.name}</strong>: {tool.description}
                      </li>
                    ))}
                  </ul>
                  <p><strong>Usage</strong>:</p>
                  <ol className="numbered-list">
                    {helpModalTranslations[helpModalLanguage].toolsAndFeatures.geometryTools.usage.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="help-section">
                  <h4>{helpModalTranslations[helpModalLanguage].toolsAndFeatures.transformTools.title}</h4>
                  <p>{helpModalTranslations[helpModalLanguage].toolsAndFeatures.transformTools.location}</p>
                  <ul className="dash-list">
                    {helpModalTranslations[helpModalLanguage].toolsAndFeatures.transformTools.tools.map((tool, index) => (
                      <li key={index}>
                        <strong>{tool.name}</strong>: {tool.description}
                      </li>
                    ))}
                  </ul>
                  <p><strong>Usage</strong>:</p>
                  <ol className="numbered-list">
                    {helpModalTranslations[helpModalLanguage].toolsAndFeatures.transformTools.usage.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="help-section">
                  <h4>{helpModalTranslations[helpModalLanguage].toolsAndFeatures.interiorTools.title}</h4>
                  <p>{helpModalTranslations[helpModalLanguage].toolsAndFeatures.interiorTools.location}</p>
                  <ul className="dash-list">
                    {helpModalTranslations[helpModalLanguage].toolsAndFeatures.interiorTools.tools.map((tool, index) => (
                      <li key={index}>
                        <strong>{tool.name}</strong>: {tool.description}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="help-section">
                  <h4>{helpModalTranslations[helpModalLanguage].toolsAndFeatures.exportTools.title}</h4>
                  <p>{helpModalTranslations[helpModalLanguage].toolsAndFeatures.exportTools.location}</p>
                  <ul className="dash-list">
                    {helpModalTranslations[helpModalLanguage].toolsAndFeatures.exportTools.tools.map((tool, index) => (
                      <li key={index}>
                        <strong>{tool.name}</strong>: {tool.description}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section className="help-section">
                <h2>{helpModalTranslations[helpModalLanguage].buildingModification.title}</h2>
                
                <div className="help-section">
                  <h4>{helpModalTranslations[helpModalLanguage].buildingModification.textBased.title}</h4>
                  <p>{helpModalTranslations[helpModalLanguage].buildingModification.textBased.location}</p>
                  <p><strong>{helpModalTranslations[helpModalLanguage].buildingModification.textBased.prompt}</strong></p>
                  <p><strong>Usage</strong>:</p>
                  <ol className="numbered-list">
                    {helpModalTranslations[helpModalLanguage].buildingModification.textBased.usage.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                  <ul className="dash-list">
                    {helpModalTranslations[helpModalLanguage].buildingModification.textBased.usage.examples.map((example, index) => (
                      <li key={index}>{example}</li>
                    ))}
                  </ul>
                </div>

                <div className="help-section">
                  <h4>{helpModalTranslations[helpModalLanguage].buildingModification.parameterBased.title}</h4>
                  <p>{helpModalTranslations[helpModalLanguage].buildingModification.parameterBased.location}</p>
                  <p><strong>{helpModalTranslations[helpModalLanguage].buildingModification.parameterBased.controls}</strong></p>
                  <p><strong>Usage</strong>:</p>
                  <ol className="numbered-list">
                    {helpModalTranslations[helpModalLanguage].buildingModification.parameterBased.usage.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="help-section">
                  <h4>{helpModalTranslations[helpModalLanguage].buildingModification.generation.title}</h4>
                  <p>{helpModalTranslations[helpModalLanguage].buildingModification.generation.location}</p>
                  <p><strong>{helpModalTranslations[helpModalLanguage].buildingModification.generation.prompt}</strong></p>
                  <p><strong>Usage</strong>:</p>
                  <ol className="numbered-list">
                    {helpModalTranslations[helpModalLanguage].buildingModification.generation.usage.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                  <ul className="dash-list">
                    {helpModalTranslations[helpModalLanguage].buildingModification.generation.usage.examples.map((example, index) => (
                      <li key={index}>{example}</li>
                    ))}
                  </ul>
                </div>

                <div className="help-section">
                  <h4>{helpModalTranslations[helpModalLanguage].buildingModification.bestPractices.title}</h4>
                  <ol className="numbered-list">
                    {helpModalTranslations[helpModalLanguage].buildingModification.bestPractices.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                  <p><strong>{helpModalTranslations[helpModalLanguage].buildingModification.bestPractices.example.title}</strong></p>
                  <blockquote>
                    {helpModalTranslations[helpModalLanguage].buildingModification.bestPractices.example.content}
                    <ul className="dash-list">
                      {helpModalTranslations[helpModalLanguage].buildingModification.bestPractices.example.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </blockquote>
                </div>

                <div className="help-section">
                  <h4>{helpModalTranslations[helpModalLanguage].buildingModification.combiningTools.title}</h4>
                  <p>{helpModalTranslations[helpModalLanguage].buildingModification.combiningTools.description}</p>
                  <ol className="numbered-list">
                    {helpModalTranslations[helpModalLanguage].buildingModification.combiningTools.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              </section>

              <section className="help-section">
                <h2>{helpModalTranslations[helpModalLanguage].workingWithObjects.title}</h2>
                
                <div className="help-section">
                  <h4>{helpModalTranslations[helpModalLanguage].workingWithObjects.selecting.title}</h4>
                  <ul className="dash-list">
                    {helpModalTranslations[helpModalLanguage].workingWithObjects.selecting.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>

                <div className="help-section">
                  <h4>{helpModalTranslations[helpModalLanguage].workingWithObjects.transforming.title}</h4>
                  <ol className="numbered-list">
                    {helpModalTranslations[helpModalLanguage].workingWithObjects.transforming.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                  <p>Use the transform gizmo:</p>
                  <ul className="dash-list">
                    <li><strong>Red</strong>: X-axis</li>
                    <li><strong>Green</strong>: Y-axis</li>
                    <li><strong>Blue</strong>: Z-axis</li>
                    <li><strong>Yellow</strong>: Free movement/rotation</li>
                  </ul>
                </div>

                <div className="help-section">
                  <h4>{helpModalTranslations[helpModalLanguage].workingWithObjects.addingGeometry.title}</h4>
                  <ol className="numbered-list">
                    {helpModalTranslations[helpModalLanguage].workingWithObjects.addingGeometry.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="help-section">
                  <h4>{helpModalTranslations[helpModalLanguage].workingWithObjects.clippingPlanes.title}</h4>
                  <ol className="numbered-list">
                    {helpModalTranslations[helpModalLanguage].workingWithObjects.clippingPlanes.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              </section>

              <section className="help-section">
                <h2>{helpModalTranslations[helpModalLanguage].tipsAndBestPractices.title}</h2>
                <ol className="numbered-list">
                  {helpModalTranslations[helpModalLanguage].tipsAndBestPractices.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </section>

              <section className="help-section">
                <h2>{helpModalTranslations[helpModalLanguage].keyboardShortcuts.title}</h2>
                <ul className="dash-list">
                  {helpModalTranslations[helpModalLanguage].keyboardShortcuts.shortcuts.map((shortcut, index) => (
                    <li key={index}>
                      <strong>{shortcut.key}</strong>: {shortcut.description}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="help-section">
                <h2>{helpModalTranslations[helpModalLanguage].troubleshooting.title}</h2>
                <ul className="dash-list">
                  {helpModalTranslations[helpModalLanguage].troubleshooting.issues.map((issue, index) => (
                    <li key={index}>{issue.description}</li>
                  ))}
                </ul>
              </section>

              <button className="help-close-button" onClick={toggleHelpModal}>Close</button>
            </div>
          </div>
        </div>
      )}
      <div className="chat-interface">
        <div className="controls-bar">
          <button className="control-button" onClick={toggleApiKeyModal}>OpenAI API Key</button>
          <button className="control-button">Setting</button>
          <button className="control-button" onClick={toggleHelpModal}>Help</button>
          <a href="https://johnmasataka.github.io/Archtalk/" target="_blank" rel="noopener noreferrer">
            <button className="control-button">Home</button>
          </a>
        </div>
        
        {showApiKeyModal && (
          <div className="api-key-modal">
            <div className="api-key-content">
              <div className="api-key-input-container">
                <input type="text" placeholder="Enter your OpenAI API Key" className="api-key-input" />
                <button className="api-key-button">OK</button>
              </div>
              <div className="api-key-warning">
                Note that this isn't best practice to enter an API key into a web app like this. 
                While it isn't stored outside of your browser, a malicious script or browser 
                extension could still access it. Ensure your account has strict limits on API 
                spend and change this API key often.
              </div>
              <div className="api-key-help">
                <a href="#" className="api-key-link">How to get OpenAI API Key?</a>
              </div>
            </div>
          </div>
        )}
        
        <div className="chat-header">
          <h3>Archtalk</h3>
        </div>
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message-container ${message.role === 'user' ? 'user-container' : 'system-container'}`}
            >
              {message.role !== 'user' && (
                <div className="avatar system-avatar">AI</div>
              )}
              <div
                className={`message ${message.role === 'user' ? 'user-message' : 'system-message'}`}
              >
                {getTypingMessage(index, message)}
              </div>
              {message.role === 'user' && (
                <div className="avatar user-avatar">User</div>
              )}
            </div>
          ))}
          {isLoadingChat && (
            <div className="message-container system-container">
              <div className="avatar system-avatar">AI</div>
              <div className="message system-message">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form className="chat-input" onSubmit={handleSubmit}>
          <div className="input-container">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter prompt (optional)..."
              disabled={isLoadingChat}
            />
            <button type="submit" disabled={isLoadingChat || !inputValue.trim()}>
              Send
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ChatInterface; 