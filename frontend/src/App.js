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

window.addEventListener("scroll", ()=>console.log('scroll'));

function ShowFacts({facts, currentIndex, visitedSets, onClick: handleClick}){
    return <div className={"fact-box"}>
        <div className>{facts.map((fact, index)=><button disabled={!visitedSets.current.has(index)} key={index} onClick={()=>handleClick(index)} style={{height: "30px", width: "30px", backgroundColor: "darkgreen",}}/>)}</div>
        {facts[currentIndex]}
    </div>

}

function SVGMap({usableNodes, countryFacts, correct}){
  const [selectedCountry, setSelectedCountry] = React.useState(undefined);
  const [factIndex, _setFactIndex] = React.useState(0);
  const [end, setEnd] = React.useState(false);
  const visitedSets = React.useRef(new Set([0]));
    const setFactIndex = (factIdx)=>{
      visitedSets.current.add(factIdx);
      _setFactIndex(factIdx)
  }
  return <div>
    <svg version={"1.1"} xmlns={"http://www.w3.org/2000/svg"} x={'0px'} y={'0px'} viewBox={"0 0 800 600"}>
    <g id={"World"}>
      {usableNodes.map((node, index)=>React.createElement(node.type, {
        ...node.attributes,
        key: index,
        onClick: ()=>{
        setSelectedCountry(node.attributes.id);
        if (factIndex === countryFacts.length -1){
            setEnd(true);
            return
        }
        setFactIndex(factIndex+1);
      },
        className: selectedCountry === node.attributes.id ? "st0-clicked" : "st0",
        disabled: factIndex === countryFacts.length
      }))}
    </g>
  </svg>
    <ShowFacts facts={countryFacts} currentIndex={factIndex} onClick={(index)=>setFactIndex(index)} visitedSets={visitedSets}/>
      {end && <div className={"dialog"}>{`Current Answer was ${correct}`}</div>}
  </div>;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

const fetchCountry = (countryName)=>Promise.resolve(['Facts1', 'Facts2', 'Facts3']);

function App() {

  const [staticXML] = useAsyncState(fetchXML);
  const _usableNodes = React.useMemo(()=>staticXML === undefined ? undefined : parseXML(staticXML), [staticXML]);
 const usableNodes = React.useMemo(()=>_usableNodes?.map((node)=>({...node, attributes: {...node.attributes, id: node.attributes.id === undefined ? 'russia' : node.attributes.id}})), [_usableNodes])
  const [correctCountry, setCorrectCountry] = React.useState(undefined);
 console.log(usableNodes?.map((node)=>node.attributes.id));
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
          usableNodes && <SVGMap usableNodes={usableNodes} countryFacts={countryFacts} correct={correctCountry.attributes.id}/>}
    </div>
  );
}



export default App;
