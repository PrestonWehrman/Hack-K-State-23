import logo from './logo.svg';
import './App.css';
import React from 'react';

function useAsyncState(callback){
  const [state, setState] = React.useState(undefined);
  React.useEffect(()=>{
    let destructor = false;
    callback().then((data)=>{
      if (destructor) return;
      setState(data);
    });
    return ()=>{
      destructor = true;
    }
  }, [callback]);
  return [state, setState];
}

const fetchXML = ()=>fetch('WorldMap.html').then(
    (response)=>response.text());

function parseXML(xmlString){
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "application/xml");
  const allUsableNodes = Array.from(doc.getElementsByTagName('g')).flatMap((gNode)=>Array.from(gNode.children));
  allUsableNodes.forEach((node, index)=>{
    if (node.tagName === 'polygon')
      node.setAttribute('id', 'russia');
  });
  const actualNodes = allUsableNodes.map((node)=>({
    type: node.tagName,
    attributes: Object.fromEntries(Array.from(node.attributes).map((attr)=>[attr.name, attr.value]))
  }));
  console.log(actualNodes[5]);
  console.log(new Set(allUsableNodes.map((node)=>node.getAttribute('id'))).size);
  return actualNodes;
}


function SVGMap({usableNodes, countryFacts}){
  const [selectedCountry, setSelectedCountry] = React.useState(undefined);
  const [factIndex, setFactIndex] = React.useState(0);
  return <div>
    <svg version={"1.1"} xmlns={"http://www.w3.org/2000/svg"} x={'0px'} y={'0px'} viewBox={"0 0 800 600"}>
    <g id={"World"}>
      {usableNodes.map((node, index)=>React.createElement(node.type, {
        ...node.attributes,
        key: index,
        onClick: ()=>{
        setSelectedCountry(node.attributes.id);
        setFactIndex(factIndex+1);
      },
        className: selectedCountry === node.attributes.id ? "st0-clicked" : "st0",
        disabled: factIndex === countryFacts.length
      }))}
    </g>
  </svg>
    <div>{countryFacts[factIndex]}</div>
  </div>;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

const fetchCountry = (countryName)=>Promise.resolve(['Facts1', 'Facts2', 'Facts3']);

function App() {

  const [staticXML] = useAsyncState(fetchXML);
  const usableNodes = React.useMemo(()=>staticXML === undefined ? undefined : parseXML(staticXML), [staticXML]);

  const [correctCountry, setCorrectCountry] = React.useState(undefined);
  React.useLayoutEffect(()=>{
    if (usableNodes === undefined) return;
    setCorrectCountry(usableNodes[getRandomInt(usableNodes.length)]);
  }, [usableNodes]);

  const [countryFacts] = useAsyncState(React.useCallback(()=>correctCountry === undefined ? Promise.resolve(undefined): fetchCountry(correctCountry), [correctCountry]));
  console.log(countryFacts)
  return (
    <div>
      {countryFacts === undefined ?
          null :
          usableNodes && <SVGMap usableNodes={usableNodes} countryFacts={countryFacts}/>}
    </div>
  );
}



export default App;
